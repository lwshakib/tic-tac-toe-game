import { Geist, Geist_Mono } from "next/font/google"
import { SocketProvider } from "@/components/socket-provider"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Tic-Tac-Toe Multiplayer",
  description:
    "A real-time multiplayer Tic-Tac-Toe game with rooms and private matches.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <SocketProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SocketProvider>
      </body>
    </html>
  )
}
