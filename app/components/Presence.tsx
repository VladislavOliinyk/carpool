"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Presence() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: { key: Math.random().toString() }
      }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const total = Object.keys(state).length;
      setCount(total);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({});
      }
    });

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 12
      }}
    >
      🟢 Онлайн: {count}
    </div>
  );
}