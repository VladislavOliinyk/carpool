"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateStats } from "../create-trip/utils/stats";
import { calculateBalance } from "../create-trip/utils/balance";

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

type Participant = {
  trip_id: string;
  user_id: string;
};

export default function StatsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
    fetchUsers();
    fetchParticipants();

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
          fetchTrips();
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
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

  async function fetchParticipants() {
    if (!supabase) return;
    const { data } = await supabase
      .from("trip_participants")
      .select("*");

    setParticipants((data as Participant[]) || []);
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.name || "—";
  }

  function formatDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  const stats = calculateStats(trips);
  const balance = calculateBalance(trips, participants);

  const topUser = Object.entries(stats)
    .sort((a, b) => b[1].kyiv - a[1].kyiv)[0];

  return (
    <div style={{ padding: 16, paddingBottom: 90 }}>

      {/* USER */}
      <UserGate users={users} onSelect={setCurrentUser} />

      {currentUser && (
        <AvailabilityToggle userId={currentUser} />
      )}

      <h2 style={{ margin: "20px 0" }}>📊 Статистика</h2>

      {/* ЛІДЕР */}
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
          }}
        >
          🏆 Лідер: {getUserName(topUser[0])}
        </div>
      )}

      {/* СТАТИСТИКА */}
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
          }}
        >
          <div>{getUserName(userId)}</div>
          <div>🚗 {s.kyiv} | 🚙 {s.feeder}</div>
        </div>
      ))}

      {/* ІСТОРІЯ */}
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

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {formatDate(t.created_at)}
              </div>
            </div>
          ))}
      </div>

      {/* 💰 БАЛАНС */}
      <div style={{ marginTop: 30 }}>
        <h3>💰 Баланс</h3>

        {Object.entries(balance).map(([userId, debts]) => (
          <div
            key={userId}
            style={{
              marginBottom: 15,
              padding: 12,
              background: "#fff7ed",
              borderRadius: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {getUserName(userId)}
            </div>

            {Object.entries(debts as Record<string, number>).map(
              ([toUserId, amount]) => (
                <div key={toUserId}>
                  винен {getUserName(toUserId)}: {amount}
                </div>
              )
            )}
          </div>
        ))}
      </div>

    </div>
  );
}