"use client";

import { useEffect } from "react";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, []);

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
        fontSize: 14
      }}
    >
      {message}
    </div>
  );
}