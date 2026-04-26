"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateStats } from "../create-trip/utils/stats";

type Trip = {
  id: string;
  driver_id: string;
  feeder_id?: string;
  created_at: string;
};

type User = {
  id: string;
  name: string;
};

export default function StatsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
  fetchTrips();
  fetchUsers();

  if (!supabase) return;

  const channel = supabase
    .channel("realtime-stats")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "trips",
      },
      () => {
        console.log("⚡ stats update");
        fetchTrips();
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}, []);

  async function fetchTrips() {
    if (!supabase) return;

    const { data } = await supabase.from("trips").select("*");
    setTrips((data as Trip[]) || []);
  }

  async function fetchUsers() {
    if (!supabase) return;

    const { data } = await supabase.from("users").select("*");
    setUsers((data as User[]) || []);
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.name || "—";
  }

  const stats = calculateStats(trips);

  // 🏆 ТОП ЮЗЕР
  const topUser = Object.entries(stats)
    .sort(
      (a, b) =>
        (b[1].kyiv + b[1].feeder) -
        (a[1].kyiv + a[1].feeder)
    )[0];

  return (
    <div style={{ padding: 16, paddingBottom: 90 }}>

      <h2 style={{ marginBottom: 20 }}>📊 Статистика</h2>

      {/* 🏆 ЛІДЕР */}
      {topUser && (
        <div
          style={{
            padding: 18,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            borderRadius: 16,
            marginBottom: 20,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 10px 25px rgba(34,197,94,0.4)"
          }}
        >
          🏆 Лідер: {getUserName(topUser[0])}
        </div>
      )}

      {/* СПИСОК */}
      {Object.entries(stats).map(([userId, s]) => (
        <div
          key={userId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 12,
            borderRadius: 12,
            background: "#f9fafb",
            marginBottom: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {getUserName(userId)}
          </div>

          <div style={{ fontSize: 14 }}>
            🚗 {s.kyiv} &nbsp;&nbsp; 🚙 {s.feeder}
          </div>
        </div>
      ))}

    </div>
  );
}