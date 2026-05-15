"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/components/socket-provider"
import {
  Lock,
  Globe,
  Share2,
  RefreshCw,
  Trophy,
  LogOut,
  ArrowLeft,
} from "lucide-react"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"

interface Player {
  id: string // Socket ID
  playerId: string // Persistent Account ID
  name: string
  symbol: "X" | "O"
  isAi?: boolean
}

interface Room {
  id: string
  name: string
  players: Player[]
  board: (string | null)[]
  currentPlayerIndex: number
  isPrivate: boolean
  status: "waiting" | "playing" | "ended"
  winner: string | null
  scores: Record<string, number>
  resetVotes: string[]
  isAiGame?: boolean
}

export default function GameRoom() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const socket = useSocket()
  const [socketId, setSocketId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState("")
  const [closedMessage, setClosedMessage] = useState("")
  const [showOverlay, setShowOverlay] = useState(true)

  useEffect(() => {
    // Get player name and ID from localStorage
    const savedName = localStorage.getItem("playerName") || ""
    let pId = localStorage.getItem("playerId")
    if (!pId) {
      pId = Math.random().toString(36).substring(2, 15)
      localStorage.setItem("playerId", pId)
    }
    setPlayerName(savedName)
    setPlayerId(pId)

    if (!savedName) {
      router.push(`/?room=${roomId}`)
      return
    }

    if (!socket) return

    setSocketId(socket.id || null)

    // Join the room automatically if we have a name
    socket.emit("join-room", {
      roomId,
      playerName: savedName,
      playerId: pId,
      isLinkJoin: true, // We assume it's a link join if they land here
    })

    socket.on("room-updated", (roomData: Room) => {
      setRoom(roomData)
      if (roomData.status === "playing") {
        setShowOverlay(true)
      }
      setError("")
    })

    socket.on("room-closed", (msg: string) => {
      setClosedMessage(msg)
      setRoom(null)
    })

    socket.on("error", (msg: string) => {
      setError(msg)
    })

    return () => {
      socket.off("room-updated")
      socket.off("room-closed")
      socket.off("error")
    }
  }, [roomId, socket, router])

  const makeMove = (index: number) => {
    if (!room) return
    socket?.emit("make-move", { roomId: room.id, index })
  }

  const resetGame = () => {
    if (!room) return
    socket?.emit("reset-game", room.id)
  }

  const leaveRoom = () => {
    socket?.emit("leave-room", roomId)
    router.push("/")
  }

  const copyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link)
    alert("Invite link copied to clipboard!")
  }

  if (closedMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6 font-sans text-zinc-900">
        <div className="w-full max-w-md animate-in space-y-8 rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm duration-700 fade-in zoom-in">
          <div className="space-y-2">
            <h2 className="text-3xl font-light tracking-tight">Room Closed</h2>
            <p className="text-sm text-zinc-400">{closedMessage}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 py-4 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6 font-sans text-zinc-900">
        <div className="w-full max-w-md animate-in space-y-8 rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm duration-700 fade-in zoom-in">
          <div className="space-y-2">
            <h2 className="text-3xl font-light tracking-tight text-red-500">
              Error
            </h2>
            <p className="text-sm text-zinc-400">{error}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 py-4 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-black">
        <p className="animate-pulse text-xl font-black">
          CONNECTING TO ROOM {roomId}...
        </p>
      </div>
    )
  }

  const currentPlayer = room.players[room.currentPlayerIndex]
  const isMyTurn = currentPlayer?.playerId === playerId

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 font-sans text-zinc-900 md:p-12">
      <div className="mx-auto max-w-4xl animate-in space-y-12 duration-700 fade-in">
        {/* Game Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-8 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-light tracking-tight">{room.name}</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400">
              {room.isPrivate ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              Session {room.id} • {room.isPrivate ? "Private" : "Public"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-50"
            >
              <Share2 className="h-3.5 w-3.5" /> Invite Link
            </button>
            <button
              onClick={leaveRoom}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-zinc-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Leave
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Scoreboard and Status */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-4">
            <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-400">
                Players
              </h3>
              <div className="space-y-4">
                {room.players.map((p, i) => (
                  <div
                    key={p.playerId}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${room.currentPlayerIndex === i ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 bg-white"}`}
                  >
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {p.name}{" "}
                        {p.playerId === playerId && (
                          <span className="text-[10px] font-normal text-zinc-400">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold tracking-tighter text-zinc-400">
                        Score: {room.scores[p.playerId] || 0}
                      </p>
                    </div>
                    <span className="font-mono text-2xl font-light text-zinc-300">
                      {p.symbol}
                    </span>
                  </div>
                ))}
                {room.players.length === 1 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-4 py-8 text-center">
                    <p className="animate-pulse text-[10px] font-bold tracking-widest text-zinc-300">
                      Waiting for opponent
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="py-4 text-center">
              {room.status === "playing" && (
                <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${isMyTurn ? "animate-pulse bg-green-500" : "bg-zinc-200"}`}
                  ></span>
                  <p className="text-[10px] font-bold tracking-widest">
                    {isMyTurn ? "Your Turn" : `${currentPlayer?.name}'s Turn`}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Game Board */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-8">
            <div className="group relative">
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-white bg-zinc-200 p-px shadow-xl">
                {room.board.map((cell, i) => (
                  <button
                    key={i}
                    onClick={() => makeMove(i)}
                    disabled={!!cell || !isMyTurn || room.status !== "playing"}
                    className={`flex h-24 w-24 items-center justify-center bg-white transition-all duration-300 sm:h-32 sm:w-32 ${!cell && isMyTurn && room.status === "playing" ? "cursor-pointer hover:bg-zinc-50" : "cursor-default"}`}
                  >
                    <span
                      className={`transform font-mono text-4xl font-extralight transition-all duration-500 sm:text-5xl ${cell ? "scale-100 opacity-100" : "scale-50 opacity-0"} ${cell === "X" ? "text-zinc-900" : "text-zinc-400"}`}
                    >
                      {cell}
                    </span>
                  </button>
                ))}
              </div>

              {/* End State Overlay */}
              {room.status === "ended" && showOverlay && (
                <div className="absolute inset-0 flex animate-in flex-col items-center justify-center rounded-2xl bg-white/60 p-8 text-center backdrop-blur-[2px] duration-500 fade-in zoom-in">
                  <Trophy className="mb-4 h-10 w-10 text-zinc-900" />
                  <h3 className="mb-8 text-3xl font-light tracking-tight">
                    {room.winner === "Draw"
                      ? "It's a draw"
                      : `${room.winner} wins`}
                  </h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={resetGame}
                      disabled={room.resetVotes.includes(playerId)}
                      className={`flex items-center gap-3 rounded-full px-8 py-3 text-sm font-medium transition-all ${
                        room.resetVotes.includes(playerId)
                          ? "bg-zinc-100 text-zinc-400"
                          : "bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
                      }`}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${room.resetVotes.includes(playerId) ? "animate-spin" : ""}`}
                      />
                      {room.resetVotes.length > 0
                        ? room.resetVotes.includes(playerId)
                          ? room.isAiGame
                            ? "Restarting..."
                            : "Waiting for Peer"
                          : "Request Rematch"
                        : "Play Again"}
                    </button>
                    <button
                      onClick={() => setShowOverlay(false)}
                      className="text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-900"
                    >
                      View Board
                    </button>
                  </div>
                </div>
              )}

              {room.status === "ended" && !showOverlay && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
                  <button
                    onClick={() => setShowOverlay(true)}
                    className="flex items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-[10px] font-bold tracking-widest text-white backdrop-blur-md transition-all hover:bg-zinc-900"
                  >
                    <Trophy className="h-3 w-3" /> Show Results
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
