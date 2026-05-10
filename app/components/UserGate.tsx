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
  const [current, setCurrent] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user_id");
  });

  useEffect(() => {
    if (current) {
      onSelect(current);
    }
  }, [current, onSelect]);

  if (current || users.length === 0) return null;

  return (
    <section className="user-gate" aria-label="Вибір користувача">
      <div>
        <span>Профіль</span>
        <strong>Хто сьогодні в застосунку?</strong>
      </div>
      <div className="user-gate-list">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => {
              localStorage.setItem("user_id", user.id);
              setCurrent(user.id);
              onSelect(user.id);
            }}
          >
            {user.name}
          </button>
        ))}
      </div>
    </section>
  );
}
