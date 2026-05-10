"use client";

import { useEffect, useState } from "react";

// 🔥 глобальний тригер
let showToastFn: (msg: string) => void;

// 👉 виклик з будь-якого місця
export function Toast(message: string) {
  showToastFn?.(message);
}

// 👉 UI компонент (підключається 1 раз у layout)
export function ToastContainer() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showToastFn = (msg: string) => {
      setMessage(msg);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 2200);

      setTimeout(() => {
        setMessage(null);
      }, 2500);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#111",
        color: "white",
        padding: "12px 20px",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        zIndex: 999,
        fontSize: 14,

        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}