"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Props = {
  userId: string | null;
};

export default function AvailabilityToggle({ userId }: Props) {
  const [active, setActive] = useState(true);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  useEffect(() => {
    if (!userId) return;
    fetchStatus();
  }, [userId]);

  async function fetchStatus() {
    if (!supabase || !userId) return;

    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateStr)
      .single();

    if (data) {
      setActive(data.available);
    } else {
      setActive(true); // дефолт: їде
    }
  }

  async function toggle() {
    if (!supabase || !userId) return;

    const newValue = !active;
    setActive(newValue);

    await supabase.from("availability").upsert([
      {
        user_id: userId,
        date: dateStr,
        available: newValue,
      },
    ]);
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        background: active ? "#e6f9ec" : "#f3f3f3",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 10 }}>
        {active ? "🟢 Я їду завтра" : "⚪ Я не їду завтра"}
      </div>

      <button
        onClick={toggle}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: active ? "#22c55e" : "#888",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Змінити
      </button>
    </div>
  );
}