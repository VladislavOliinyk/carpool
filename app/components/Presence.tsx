"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Presence() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    const channel = client.channel("online-users", {
      config: {
        presence: { key: crypto.randomUUID() },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      setCount(Object.keys(channel.presenceState()).length || 1);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return (
    <div className="presence-pill" aria-label={`${count} користувачі онлайн`}>
      <span />
      {count} онлайн
    </div>
  );
}
