"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSocket } from "@/components/socket-provider"
import { User, Lock, Globe, Trophy, RefreshCw, Loader2 } from "lucide-react"
import { Icon } from "@iconify/react"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"

interface RoomListItem {
  id: string
  name: string
  players: number
  isPrivate: boolean
  status: "waiting" | "playing" | "ended"
}

export default function TicTacToeLobby() {
  const router = useRouter()
  // No socket needed here anymore
  const [playerName, setPlayerName] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [hasProfile, setHasProfile] = useState(false)
  const playerNameRef = useRef(playerName)

  // Account States
  const [savedAccounts, setSavedAccounts] = useState<
    { id: string; name: string; password?: string }[]
  >([])
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showManualLogin, setShowManualLogin] = useState(false)
  const [accountPassword, setAccountPassword] = useState("")
  const [loginName, setLoginName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const currentPasswordRef = useRef("")

  // Update ref whenever state changes
  useEffect(() => {
    playerNameRef.current = playerName
  }, [playerName])

  useEffect(() => {
    const savedName = localStorage.getItem("playerName")
    const savedId = localStorage.getItem("playerId")
    const token = localStorage.getItem("token")
    const storedAccounts = localStorage.getItem("savedAccounts")

    if (savedName && savedId && token) {
      // Validate current session
      fetch(`${SOCKET_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setPlayerName(savedName)
            setPlayerId(savedId)
            setHasProfile(true)

            if (data.data.currentRoomId) {
              router.push(`/room/${data.data.currentRoomId}`)
            }
          } else {
            handleDeleteProfile()
          }
        })
        .catch(() => {
          // If server is down, we might want to keep the local state or show an error
        })
    }

    // Validate saved accounts
    if (storedAccounts) {
      try {
        const accounts = JSON.parse(storedAccounts)
        if (accounts.length > 0) {
          fetch(`${SOCKET_URL}/api/auth/validate-accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accounts }),
          }).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              const valid = data.data
              setSavedAccounts(valid)
              localStorage.setItem("savedAccounts", JSON.stringify(valid))
            }
          })
        }
      } catch (e) {}
    }
  }, [])

  // Join States
  const [joinRoomId, setJoinRoomId] = useState("")
  const [joinPassword, setJoinPassword] = useState("")
  const [needsPassword, setNeedsPassword] = useState(false)

  // Create States
  const [createRoomName, setCreateRoomName] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isAgainstAi, setIsAgainstAi] = useState(false)

  const [roomList, setRoomList] = useState<RoomListItem[]>([])
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRoomList = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`${SOCKET_URL}/api/rooms`)
      const data = await res.json()
      setRoomList(data.data)
    } catch (err) {
      console.error("Error fetching rooms:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRoomList()
    const params = new URLSearchParams(window.location.search)
    const urlRoomId = params.get("room")
    if (urlRoomId) {
      setJoinRoomId(urlRoomId.toUpperCase())
    }
  }, [])

  const handleCreateAccount = async () => {
    if (!playerName.trim() || !accountPassword.trim()) {
      setError("Name and password are required.")
      return
    }

    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName, password: accountPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Failed to create account")
        return
      }

      localStorage.setItem("playerName", data.data.name)
      localStorage.setItem("playerId", data.data.id)
      localStorage.setItem("token", data.data.token)
      window.dispatchEvent(new Event("auth-change"))

      // Update saved accounts
      const stored = localStorage.getItem("savedAccounts")
      let accounts = []
      if (stored) {
        try {
          accounts = JSON.parse(stored)
        } catch (e) {}
      }
      accounts = accounts.filter((a: any) => a.id !== data.data.id)
      accounts.push({
        id: data.data.id,
        name: data.data.name,
        token: data.data.token,
      })
      localStorage.setItem("savedAccounts", JSON.stringify(accounts))
      setSavedAccounts(accounts)

      setPlayerName(data.data.name)
      setPlayerId(data.data.id)
      setHasProfile(true)
      setShowCreateAccount(false)
      setAccountPassword("")
      setError("")
    } catch (err) {
      setError("Failed to create account")
    }
  }

  const handleLogin = async (
    manualName?: string,
    manualPassword?: string,
    savedToken?: string
  ) => {
    const name = manualName || loginName
    const password = manualPassword || loginPassword

    // If we have a saved token, we can try to use it directly,
    // but the backend /login still needs password.
    // If we are "logging in" from a saved account button, we either have password or token.

    if (!name.trim() || (!password.trim() && !savedToken)) return

    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Invalid username or password")
        return
      }

      localStorage.setItem("playerName", data.data.name)
      localStorage.setItem("playerId", data.data.id)
      localStorage.setItem("token", data.data.token)
      window.dispatchEvent(new Event("auth-change"))

      // Update saved accounts
      const stored = localStorage.getItem("savedAccounts")
      let accounts = []
      if (stored) {
        try {
          accounts = JSON.parse(stored)
        } catch (e) {}
      }
      accounts = accounts.filter((a: any) => a.id !== data.data.id)
      accounts.push({
        id: data.data.id,
        name: data.data.name,
        token: data.data.token,
      })
      localStorage.setItem("savedAccounts", JSON.stringify(accounts))
      setSavedAccounts(accounts)

      setPlayerName(data.data.name)
      setPlayerId(data.data.id)
      setHasProfile(true)
      setShowManualLogin(false)
      setLoginPassword("")
      setLoginName("")
      setError("")

      if (data.data.currentRoomId) {
        router.push(`/room/${data.data.currentRoomId}`)
      }
    } catch (err) {
      setError("Login failed")
    }
  }

  const loginWithSavedAccount = (account: {
    id: string
    name: string
    token?: string
  }) => {
    // If we have a token, we should check if it's still valid by trying to use it
    if (account.token) {
      localStorage.setItem("playerName", account.name)
      localStorage.setItem("playerId", account.id)
      localStorage.setItem("token", account.token)
      window.dispatchEvent(new Event("auth-change"))

      // Verify and redirect
      fetch(`${SOCKET_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${account.token}` },
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setHasProfile(true)
          if (data.data.currentRoomId) {
            router.push(`/room/${data.data.currentRoomId}`)
          }
        } else {
          // Token expired, need password
          setLoginName(account.name)
          setShowManualLogin(true)
          setError("Session expired. Please log in again.")
        }
      })
      return
    }

    setLoginName(account.name)
    setShowManualLogin(true)
  }

  const handleDeleteProfile = () => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch(`${SOCKET_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    localStorage.removeItem("playerName")
    localStorage.removeItem("playerId")
    localStorage.removeItem("token")
    window.dispatchEvent(new Event("auth-change"))
    setPlayerName("")
    setPlayerId("")
    setHasProfile(false)
  }

  const createRoom = async () => {
    if (!playerName || !createRoomName) {
      setError("Please provide both your name and a room name.")
      return
    }

    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${SOCKET_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomName: createRoomName,
          isPrivate,
          password: isPrivate ? createPassword : undefined,
          isAi: isAgainstAi,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/room/${data.data.id}`)
      } else {
        setError(data.message || "Failed to create room")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    }
  }

  const connectRoom = async (roomIdOverride?: string) => {
    const targetId = (roomIdOverride || joinRoomId).toUpperCase()
    if (!playerName || !targetId) {
      setError("Please provide your name and a room ID.")
      return
    }

    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${SOCKET_URL}/api/rooms/${targetId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: joinPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/room/${targetId}`)
      } else {
        setError(data.message || "Failed to join room")
        if (data.message === "Incorrect password") {
          setNeedsPassword(true)
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
    }
  }

  if (!hasProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6 font-sans text-zinc-900">
        <div className="w-full max-w-[400px] animate-in space-y-8 duration-700 fade-in">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-light tracking-tight text-zinc-900">
              Tic Tac Toe
            </h1>
            <p className="text-sm text-zinc-400">
              Experience classic gaming in real-time.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            {!showCreateAccount &&
            !showManualLogin &&
            savedAccounts.length > 0 ? (
              // Saved Accounts View
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium">Saved Accounts</h2>
                  <p className="text-xs text-zinc-400">
                    Select your account to sign in automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  {savedAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => loginWithSavedAccount(account)}
                      className="group flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-600 transition-colors group-hover:bg-zinc-200 group-hover:text-zinc-900">
                        {account.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex flex-1 flex-col items-start">
                        <span className="font-medium text-zinc-900">
                          {account.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Click to login
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 py-2 text-center text-[10px] font-medium text-red-500">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-2 text-center">
                  <button
                    onClick={() => {
                      setShowManualLogin(true)
                      setError("")
                    }}
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-900"
                  >
                    Login with a different account
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateAccount(true)
                      setError("")
                    }}
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-900"
                  >
                    Don't have an account?{" "}
                    <span className="underline">Create one</span>
                  </button>
                </div>
              </div>
            ) : showManualLogin ||
              (!showCreateAccount && savedAccounts.length === 0) ? (
              // Manual Login View
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium">Welcome Back</h2>
                  <p className="text-xs text-zinc-400">
                    Enter your credentials to continue.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-semibold tracking-wider text-zinc-400">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm ring-zinc-100 transition-all outline-none focus:ring-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[10px] font-semibold tracking-wider text-zinc-400">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm ring-zinc-100 transition-all outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 py-2 text-center text-[10px] font-medium text-red-500">
                    {error}
                  </p>
                )}

                <button
                  onClick={() => handleLogin()}
                  disabled={!loginName || !loginPassword}
                  className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  Sign In
                </button>

                <div className="flex flex-col gap-2 pt-2 text-center">
                  {savedAccounts.length > 0 && (
                    <button
                      onClick={() => {
                        setShowManualLogin(false)
                        setError("")
                      }}
                      className="text-xs text-zinc-400 transition-colors hover:text-zinc-900"
                    >
                      View saved accounts
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowCreateAccount(true)
                      setShowManualLogin(false)
                      setError("")
                    }}
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-900"
                  >
                    Don't have an account?{" "}
                    <span className="underline">Create one</span>
                  </button>
                </div>
              </div>
            ) : (
              // Create Account View
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium">Create Account</h2>
                  <p className="text-xs text-zinc-400">
                    Join the community and start playing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-semibold tracking-wider text-zinc-400">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm ring-zinc-100 transition-all outline-none focus:ring-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[10px] font-semibold tracking-wider text-zinc-400">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm ring-zinc-100 transition-all outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 py-2 text-center text-[10px] font-medium text-red-500">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleCreateAccount}
                  className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Get Started
                </button>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setShowCreateAccount(false)
                      setShowManualLogin(savedAccounts.length === 0)
                      setError("")
                    }}
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-900"
                  >
                    Already have an account?{" "}
                    <span className="underline">Sign in</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 font-sans text-zinc-900 md:p-12">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight">Game Lobby</h1>
            <p className="text-xs text-zinc-400">
              Logged in as{" "}
              <span className="font-medium text-zinc-900">{playerName}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/lwshakib/tic-tac-toe-game"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-900"
            >
              <Icon icon="mdi:github" className="h-4 w-4" />
              <span>Open Source</span>
            </a>
            <button
              onClick={handleDeleteProfile}
              className="flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-900"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Controls Column */}
          <div className="space-y-8 lg:col-span-1">
            {/* Create Room */}
            <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-400">
                New Room
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Room Name"
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm ring-zinc-100 transition-all outline-none focus:ring-2"
                />

                <div className="flex gap-2 rounded-lg bg-zinc-100 p-1">
                  <button
                    onClick={() => setIsAgainstAi(false)}
                    className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${!isAgainstAi ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                  >
                    Human
                  </button>
                  <button
                    onClick={() => setIsAgainstAi(true)}
                    className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${isAgainstAi ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                  >
                    Computer
                  </button>
                </div>

                {!isAgainstAi && (
                  <div className="flex gap-2 rounded-lg bg-zinc-100 p-1">
                    <button
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${!isPrivate ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                    >
                      Public
                    </button>
                    <button
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${isPrivate ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                    >
                      Private
                    </button>
                  </div>
                )}

                {isPrivate && (
                  <input
                    type="password"
                    placeholder="Access Code"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none"
                  />
                )}

                <button
                  onClick={createRoom}
                  className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Create Room
                </button>
              </div>
            </section>

            {/* Manual Join */}
            <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-400">
                Join via ID
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter 6-digit ID"
                  value={joinRoomId}
                  onChange={(e) => {
                    setJoinRoomId(e.target.value.toUpperCase())
                    setNeedsPassword(false)
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-center font-mono text-sm tracking-widest ring-zinc-100 transition-all outline-none focus:ring-2"
                />

                {(needsPassword ||
                  (joinRoomId &&
                    roomList.find((r) => r.id === joinRoomId)?.isPrivate)) && (
                  <input
                    type="password"
                    placeholder="Access Code"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none"
                    autoFocus
                  />
                )}

                {error && (
                  <p className="text-center text-[10px] font-medium text-red-500">
                    {error}
                  </p>
                )}

                <button
                  onClick={() => connectRoom()}
                  className="w-full rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                >
                  Join Room
                </button>
              </div>
            </section>
          </div>

          {/* Room List Column */}
          <div className="space-y-8 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-400">
                Active Sessions
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchRoomList}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh
                </button>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-zinc-200"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-300"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-300">
                    Manual
                  </span>
                </div>
              </div>
            </div>

            {roomList.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center">
                <Globe className="mb-2 h-8 w-8 text-zinc-200" />
                <p className="text-sm font-medium text-zinc-400">
                  No sessions are currently active.
                </p>
                <p className="text-xs text-zinc-300">
                  Start a new room to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {roomList.map((r) => (
                  <div
                    key={r.id}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:border-zinc-900"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-zinc-900">{r.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-zinc-400">
                          <span>{r.id}</span>
                          <span>•</span>
                          <span>{r.isPrivate ? "Private" : "Public"}</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-zinc-100 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                        {r.players}/2
                      </span>
                    </div>

                    <button
                      disabled={r.players >= 2}
                      onClick={() => {
                        if (!r.isPrivate) connectRoom(r.id)
                        else {
                          setJoinRoomId(r.id)
                          setNeedsPassword(true)
                          setError("")
                        }
                      }}
                      className="w-full rounded-lg bg-zinc-50 py-2 text-xs font-medium text-zinc-600 transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white disabled:opacity-30 disabled:group-hover:bg-zinc-50 disabled:group-hover:text-zinc-600"
                    >
                      {r.players >= 2 ? "Session Full" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
