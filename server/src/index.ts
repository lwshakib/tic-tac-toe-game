import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
}

interface Room {
  name: string;
  players: Player[];
  board: (string | null)[];
  currentPlayerIndex: number;
  password?: string;
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'ended';
  winner: string | null;
  scores: Record<string, number>;
  resetVotes: string[];
}

const rooms = new Map<string, Room>();

const io = new Server({
  cors: {
    origin: "*",
  },
});

function getRoomList() {
  return Array.from(rooms.values()).map(r => ({
    name: r.name,
    players: r.players.length,
    isPrivate: r.isPrivate,
    status: r.status
  }));
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("room-list", getRoomList());

  socket.on("create-room", ({ roomName, playerName, isPrivate, password }) => {
    const roomId = roomName.toUpperCase();
    if (rooms.has(roomId)) {
      socket.emit("error", "Room ID already exists");
      return;
    }

    const room: Room = {
      name: roomName,
      players: [{ id: socket.id, name: playerName, symbol: 'X' }],
      board: Array(9).fill(null),
      currentPlayerIndex: 0,
      isPrivate,
      password: isPrivate ? password : undefined,
      status: 'waiting',
      winner: null,
      scores: { [socket.id]: 0 },
      resetVotes: [],
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit("room-created", room);
    io.emit("room-list", getRoomList());
    console.log(`Room created: ${roomId} by ${playerName}`);
  });

  socket.on("join-room", ({ roomId, playerName, password, isLinkJoin }) => {
    const room = rooms.get(roomId.toUpperCase());

    if (!room) {
      socket.emit("error", "Room ID not found");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("error", "Room is full");
      return;
    }

    if (!isLinkJoin && room.isPrivate && room.password !== password) {
      socket.emit("error", "Incorrect password");
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      symbol: room.players.length === 0 ? 'X' : 'O',
    };

    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(roomId.toUpperCase());

    if (room.players.length === 2) {
      room.status = 'playing';
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room);
    io.emit("room-list", getRoomList());
    console.log(`${playerName} joined room: ${roomId}`);
  });

  socket.on("make-move", ({ roomId, index }) => {
    const room = rooms.get(roomId.toUpperCase());
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer?.id !== socket.id) return;
    if (index < 0 || index > 8 || room.board[index] !== null) return;

    room.board[index] = currentPlayer.symbol;
    
    const winner = checkWinner(room.board);
    if (winner) {
      room.status = 'ended';
      if (winner === 'Draw') {
        room.winner = 'Draw';
      } else {
        room.winner = currentPlayer.name;
        room.scores[currentPlayer.id] = (room.scores[currentPlayer.id] || 0) + 1;
      }
    } else {
      room.currentPlayerIndex = 1 - room.currentPlayerIndex;
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room);
  });

  socket.on("reset-game", (roomId) => {
    const room = rooms.get(roomId.toUpperCase());
    if (!room) return;

    if (!room.resetVotes.includes(socket.id)) {
      room.resetVotes.push(socket.id);
    }

    if (room.resetVotes.length >= room.players.length) {
      room.board = Array(9).fill(null);
      room.status = 'playing';
      room.currentPlayerIndex = 0;
      room.winner = null;
      room.resetVotes = [];
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room);
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          room.status = 'waiting';
          room.board = Array(9).fill(null);
          room.winner = null;
          io.to(roomId).emit("room-updated", room);
        }
      }
    }
    io.emit("room-list", getRoomList());
  });
});

function checkWinner(board: (string | null)[]): string | null {
  const lines: [number, number, number][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'Draw';
  }

  return null;
}

io.listen(Number(PORT));
console.log(`Server running on port ${PORT}`);
