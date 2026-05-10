import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import Presence from "./components/Presence";
import { ToastContainer } from "./components/Toast";

export const metadata: Metadata = {
  title: "Carpool",
  description: "Справедливий баланс спільних поїздок до Києва",
  manifest: "/manifest.json",
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

        <BottomNav />
        <Presence />

        {/* 🔥 TOAST */}
        <ToastContainer />
      </body>
    </html>
  );
}
