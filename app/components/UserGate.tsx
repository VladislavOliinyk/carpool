"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
};

type Props = {
  users: User[];
  onSelect: (userId: string) => void;
};

export default function UserGate({ users, onSelect }: Props) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_id");
    if (saved) {
      setCurrent(saved);
      onSelect(saved);
    }
  }, []);

  if (current) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <h2>Хто ти?</h2>

      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => {
            localStorage.setItem("user_id", u.id);
            setCurrent(u.id);
            onSelect(u.id);
          }}
          style={{
            margin: 8,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            width: 200,
          }}
        >
          {u.name}
        </button>
      ))}
    </div>
  );
}