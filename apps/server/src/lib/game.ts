import logger from "../logger/winston.logger.js"
import * as db from "./db.js"

// Interface for player data
export interface Player {
  id: string // Socket ID
  playerId: string // Persistent Player ID
  name: string // Player display name
  symbol: "X" | "O" // Game symbol
  isAi?: boolean // Flag for AI player
}

// Interface for room data
export interface RoomData {
  id: string // Unique Room ID
  name: string // Room display name
  creatorId: string // Persistent Player ID of the room creator
  players: Player[] // List of players in the room
  board: (string | null)[] // 3x3 game board state
  currentPlayerIndex: number // Index of the player whose turn it is
  isPrivate: boolean // Flag for password protection
  status: "waiting" | "playing" | "ended" // Current state of the game
  winner: string | null // Name of the winner or 'Draw'
  scores: Record<string, number> // Session scores for each player
  resetVotes: string[] // List of persistent playerIds who voted to reset
  isAiGame?: boolean // Flag for AI game
}

export const games = new Map<string, TicTacToeGame>()

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export class TicTacToeGame {
  private room: RoomData
  private password: string | undefined

  constructor(
    roomId: string,
    roomName: string,
    creatorName: string,
    creatorId: string,
    creatorPlayerId: string,
    isPrivate: boolean,
    password?: string,
    isAi: boolean = false
  ) {
    this.password = password
    this.room = {
      id: roomId,
      name: roomName,
      creatorId: creatorPlayerId,
      players: [
        {
          id: creatorId,
          playerId: creatorPlayerId,
          name: creatorName,
          symbol: "X",
        },
      ],
      board: Array(9).fill(null),
      currentPlayerIndex: 0,
      isPrivate,
      status: "waiting",
      winner: null,
      scores: { [creatorPlayerId]: 0 },
      resetVotes: [],
    }
    this.room.isAiGame = isAi
    if (isAi) {
      this.room.players.push({
        id: "computer",
        playerId: "computer",
        name: "Computer",
        symbol: "O",
        isAi: true,
      })
      this.room.scores["computer"] = 0
      this.room.status = "playing"
    }
  }

  // Static factory method to create and save a game
  static async create(
    roomId: string,
    roomName: string,
    creatorName: string,
    creatorId: string,
    creatorPlayerId: string,
    isPrivate: boolean,
    password?: string,
    isAi: boolean = false
  ): Promise<TicTacToeGame> {
    const game = new TicTacToeGame(
      roomId,
      roomName,
      creatorName,
      creatorId,
      creatorPlayerId,
      isPrivate,
      password,
      isAi
    )
    await game.saveToDb()
    return game
  }

  // Get current room state
  getRoomData(): RoomData {
    return { ...this.room }
  }

  // Sync state to database
  async saveToDb() {
    try {
      await db.saveRoom(this.room, this.password)
    } catch (err) {
      logger.error("Error saving game to DB:", err)
    }
  }

  // Static method to load a game from DB
  static async fromDb(roomId: string): Promise<TicTacToeGame | undefined> {
    const row = await db.getRoomById(roomId)
    if (!row) return undefined

    // This is a bit tricky because we don't have the active socket IDs here.
    // They will be re-assigned when players join/reconnect.
    // For now, this helper is mainly to check room existence and basic metadata.
    const game = new TicTacToeGame(
      row.id,
      row.name,
      "",
      "",
      row.creator_id,
      row.is_private,
      row.password,
      row.is_ai_game
    )
    game.room.status = row.status
    game.room.currentPlayerIndex = row.current_player_index
    game.room.winner = row.winner
    game.room.board = row.board
    game.room.scores = row.scores || {}
    game.room.resetVotes = row.reset_votes || []

    // In fromDb, the constructor adds one player (creator) and one AI (if isAi is true).
    // We should keep them, but since we don't have socket IDs yet, their 'id' fields are empty.
    // That's fine, they will be updated in addPlayer during reconnect.

    return game
  }

  // Add a player to the room
  addPlayer(
    playerName: string,
    socketId: string,
    playerId: string,
    password?: string,
    isLinkJoin: boolean = false
  ): boolean | string {
    const existingPlayer = this.room.players.find(
      (p) => p.playerId === playerId
    )
    if (existingPlayer) {
      existingPlayer.id = socketId // Update socket ID on reconnection
      return true
    }

    if (this.room.players.length >= 2) return "Room is full"
    if (!isLinkJoin && this.room.isPrivate && this.password !== password)
      return "Incorrect password"

    const player: Player = {
      id: socketId,
      playerId: playerId,
      name: playerName,
      symbol: this.room.players.length === 0 ? "X" : "O",
    }

    this.room.players.push(player)
    if (!(playerId in this.room.scores)) {
      this.room.scores[playerId] = 0
    }

    if (this.room.players.length === 2) {
      this.room.status = "playing"
    }

    this.saveToDb()
    return true
  }

  // Remove a player from the room
  removePlayer(socketId: string): boolean {
    const index = this.room.players.findIndex((p) => p.id === socketId)
    if (index === -1) return false

    const player = this.room.players[index]
    if (!player) return false

    const isCreator = player.playerId === this.room.creatorId
    this.room.players.splice(index, 1)

    if (this.room.players.length === 0 || isCreator) {
      db.deleteRoom(this.room.id)
      return true // Room should be deleted
    }

    // Reset game state if someone leaves
    this.room.status = "waiting"
    this.room.board = Array(9).fill(null)
    this.room.winner = null
    this.room.resetVotes = []

    this.saveToDb()
    return false
  }

  // Handle a player move
  makeMove(playerId: string, index: number): boolean {
    if (this.room.status !== "playing") return false

    const currentPlayer = this.room.players[this.room.currentPlayerIndex]
    if (currentPlayer?.id !== playerId) return false
    if (index < 0 || index > 8 || this.room.board[index] !== null) return false

    this.room.board[index] = currentPlayer.symbol

    const winner = this.checkWinner()
    if (winner) {
      this.room.status = "ended"
      if (winner === "Draw") {
        this.room.winner = "Draw"
      } else {
        this.room.winner = currentPlayer.name
        this.room.scores[currentPlayer.playerId] =
          (this.room.scores[currentPlayer.playerId] || 0) + 1
      }
    } else {
      this.room.currentPlayerIndex = 1 - this.room.currentPlayerIndex
    }

    this.saveToDb()
    return true
  }

  // Handle AI move
  makeAiMove(): number | null {
    if (this.room.status !== "playing" || !this.room.isAiGame) return null
    const currentPlayer = this.room.players[this.room.currentPlayerIndex]
    if (!currentPlayer || !currentPlayer.isAi) return null

    const bestMove = this.getBestMove()
    if (bestMove !== null) {
      this.makeMove("computer", bestMove)
      return bestMove
    }
    return null
  }

  private getBestMove(): number | null {
    const board = [...this.room.board]
    const aiSymbol = "O"
    const humanSymbol = "X"

    let bestScore = -Infinity
    let move = null

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol
        let score = this.minimax(board, 0, false, aiSymbol, humanSymbol)
        board[i] = null
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
  }

  private minimax(
    board: (string | null)[],
    depth: number,
    isMaximizing: boolean,
    aiSymbol: string,
    humanSymbol: string
  ): number {
    const winner = this.checkBoardWinner(board)
    if (winner === aiSymbol) return 10 - depth
    if (winner === humanSymbol) return depth - 10
    if (board.every((cell) => cell !== null)) return 0

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = aiSymbol
          let score = this.minimax(
            board,
            depth + 1,
            false,
            aiSymbol,
            humanSymbol
          )
          board[i] = null
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = humanSymbol
          let score = this.minimax(
            board,
            depth + 1,
            true,
            aiSymbol,
            humanSymbol
          )
          board[i] = null
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }

  private checkBoardWinner(board: (string | null)[]): string | null {
    const lines: [number, number, number][] = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  // Handle voting for a reset
  voteReset(playerId: string): boolean {
    if (!this.room.resetVotes.includes(playerId)) {
      this.room.resetVotes.push(playerId)
    }

    const humanPlayers = this.room.players.filter((p) => !p.isAi)
    const requiredVotes = this.room.isAiGame ? 1 : humanPlayers.length

    if (this.room.resetVotes.length >= requiredVotes) {
      this.room.board = Array(9).fill(null)
      this.room.status = "playing"
      this.room.currentPlayerIndex = 0
      this.room.winner = null
      this.room.resetVotes = []
      this.saveToDb()
      return true // Game was reset
    }

    this.saveToDb()
    return false
  }

  // Logic to determine win or draw
  private checkWinner(): string | null {
    const lines: [number, number, number][] = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Cols
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ]

    for (const [a, b, c] of lines) {
      if (
        this.room.board[a] &&
        this.room.board[a] === this.room.board[b] &&
        this.room.board[a] === this.room.board[c]
      ) {
        return this.room.board[a]
      }
    }

    if (this.room.board.every((cell) => cell !== null)) {
      return "Draw"
    }

    return null
  }

  // Check if a player is in this room
  hasPlayer(playerId: string): boolean {
    return this.room.players.some((p) => p.id === playerId)
  }

  // Get summary of the room for the room list
  getSummary() {
    return {
      id: this.room.id,
      name: this.room.name,
      players: this.room.players.length,
      isPrivate: this.room.isPrivate,
      status: this.room.status,
    }
  }

  // Get the room password (for internal validation)
  getPassword() {
    return this.password
  }
}
