"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateStats } from "../create-trip/utils/stats";

import UserGate from "../components/UserGate";
import AvailabilityToggle from "../components/AvailabilityToggle";

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
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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

  // 📅 ФОРМАТ ДАТИ
  function formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  const stats = calculateStats(trips);

const topUser = Object.entries(stats)
  .sort((a, b) => b[1].kyiv - a[1].kyiv)[0];

  return (
    <div style={{ padding: 16, paddingBottom: 90 }}>

      {/* 👤 ВИБІР ЮЗЕРА */}
      <UserGate users={users} onSelect={setCurrentUser} />

      {/* 🔘 AVAILABILITY */}
      {currentUser && (
        <AvailabilityToggle userId={currentUser} />
      )}

      <h2 style={{ margin: "20px 0" }}>📊 Статистика</h2>

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

          <div>
            🚗 {s.kyiv} &nbsp;&nbsp; 🚙 {s.feeder}
          </div>
        </div>
      ))}

      {/* 📅 ІСТОРІЯ ПОЇЗДОК */}
      <div style={{ marginTop: 30 }}>
        <h3>Останні поїздки</h3>

        {trips
          .slice()
          .reverse()
          .slice(0, 5)
          .map((t) => (
            <div
              key={t.id}
              style={{
                marginBottom: 10,
                padding: 10,
                background: "#f9fafb",
                borderRadius: 10,
              }}
            >
              <div>
                🚗 {getUserName(t.driver_id)}
                {t.feeder_id &&
                  ` (підвіз: ${getUserName(t.feeder_id)})`}
              </div>

              {/* 📅 ДАТА */}
              <div style={{ opacity: 0.6, fontSize: 12 }}>
                {formatDate(t.created_at)}
              </div>
            </div>
          ))}
      </div>

    </div>
  );
}