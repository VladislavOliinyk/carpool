"use client";

import { useState } from "react";

export default function Home() {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "40px 20px, paddingBottom: 100",
      fontFamily: "system-ui",
      background: "linear-gradient(180deg, #f9fafb 0%, #eef2f7 100%)",
      animation: "fadeIn 0.6s ease"
    }}>

      <div />

      {/* CENTER */}
      <div style={{
        textAlign: "center",
        animation: "slideUp 0.7s ease"
      }}>

        {/* ICON */}
        <div style={{
          width: 150,
          height: 150,
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          margin: "0 auto 24px",
          transform: "scale(1)",
          transition: "0.3s"
        }}>
          <img
            src="/icon-512.png"
            alt="Carpool"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* TITLE */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.5px"
        }}>
          Carpool
        </h1>

        {/* SUB */}
        <p style={{
          color: "#6b7280",
          marginTop: 10,
          fontSize: 15
        }}>
          EV ride sharing, але без хаосу ⚡
        </p>

      </div>

      {/* BUTTON */}
      <a href="/create-trip" style={{ width: "100%" }}>
        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          style={{
            width: "100%",
            padding: 18,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            border: "none",
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 700,
            transform: pressed ? "scale(0.96)" : "scale(1)",
            transition: "0.15s",
            boxShadow: "0 10px 25px rgba(34,197,94,0.4)"
          }}
        >
          ➕ Додати поїздку
        </button>
      </a>

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

    </div>
  );
}