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
        setActive(true);
      }
    }

    if (!userId) return;
    fetchStatus();
  }, [dateStr, userId]);

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
    <section className={`availability ${active ? "active" : ""}`}>
      <div>
        <span>Завтра</span>
        <strong>{active ? "Я їду" : "Я не їду"}</strong>
      </div>
      <button onClick={toggle}>{active ? "Змінити" : "Увімкнути"}</button>
    </section>
  );
}
