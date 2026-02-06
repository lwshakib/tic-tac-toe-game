import type { Metadata } from "next"; // Import Next.js Metadata type for SEO and document head management
import { Geist, Geist_Mono } from "next/font/google"; // Import custom fonts from Google Fonts via Next.js
import "./globals.css"; // Import the global stylesheet for the entire application

const geistSans = Geist({ // Initialize the Geist Sans font
  variable: "--font-geist-sans", // Define a CSS variable name for this font
  subsets: ["latin"], // Specify the character subsets to include
});

const geistMono = Geist_Mono({ // Initialize the Geist Mono font
  variable: "--font-geist-mono", // Define a CSS variable name for this font
  subsets: ["latin"], // Specify the character subsets to include
});

export const metadata: Metadata = { // Define the static metadata for the application
  title: "Multiplayer Tic Tac Toe", // Set the title tag of the web page
  description: "Play Tic Tac Toe with your friends online in real-time.", // Set the meta description for SEO
};

export default function RootLayout({ // Define the root layout component that wraps all pages
  children, // Destructure the children prop which contains the page content
}: Readonly<{ // Use a read-only type for the props
  children: React.ReactNode; // Type definition for children as React nodes
}>) {
  return (
    /* Define the HTML document with English language setting */
    <html lang="en">
      <body
        /* Apply font variables and antialiasing class */
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render the nested page content here */}
        {children}
      </body>
    </html>
  );
}
