"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"

const SocketContext = createContext<Socket | null>(null)

export const useSocket = (): Socket | null => useContext(SocketContext)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setSocket(null)
        return
      }

      const s = io(SOCKET_URL, {
        auth: { token },
      })
      setSocket(s)
      return s
    }

    let s = connect()

    const handleAuthChange = () => {
      if (s) s.disconnect()
      s = connect()
    }

    window.addEventListener("auth-change", handleAuthChange)

    return () => {
      if (s) s.disconnect()
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  )
}
