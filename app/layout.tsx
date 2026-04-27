import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import Presence from "./components/Presence";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carpool",
  description: "Carpool EV App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>

      <body>
        {children}

        {/* 🔻 Нижнє меню */}
        <BottomNav />

        {/* 🟢 Онлайн юзери */}
        <Presence />
      </body>
    </html>
  );
}