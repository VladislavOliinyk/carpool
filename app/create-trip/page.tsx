"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { calculateStats } from "./utils/stats";
import { getNextDriverSmart } from "./utils/recommend";

import Toast from "../components/Toast";
import UserGate from "../components/UserGate";
import AvailabilityToggle from "../components/AvailabilityToggle";

type User = {
  id: string;
  name: string;
};

type Trip = {
  id: string;
  driver_id: string;
  feeder_id?: string;
  created_at: string;
};

export default function CreateTrip() {
  const [users, setUsers] = useState<User[]>([]);
  const [driver, setDriver] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [feeder, setFeeder] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // 👤 CURRENT USER
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // 🧠 AVAILABILITY MAP
  const [availabilityMap, setAvailabilityMap] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchUsers();
    fetchTrips();
    fetchAvailability();

    if (!supabase) return;

    const channel = supabase
      .channel("realtime-trips")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trips",
        },
        () => {
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

  async function fetchUsers() {
    if (!supabase) return;
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
  }

  async function fetchTrips() {
    if (!supabase) return;
    const { data } = await supabase.from("trips").select("*");
    setTrips(data || []);
  }

  // 🟢 AVAILABILITY
  async function fetchAvailability() {
    if (!supabase) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("date", dateStr);

    const map: { [key: string]: boolean } = {};

    data?.forEach((row: any) => {
      map[row.user_id] = row.is_active;
    });

    setAvailabilityMap(map);
  }

  function toggleUser(id: string) {
    if (participants.includes(id)) {
      setParticipants(participants.filter((p) => p !== id));
    } else {
      setParticipants([...participants, id]);
    }
  }

  function getUserName(id: string) {
    return users.find((u) => u.id === id)?.name || "—";
  }

  const isIgorDriver =
    users.find((u) => u.id === driver)?.name === "Ігор";

  // 🚗 CREATE TRIP
  async function createTrip() {
    if (!driver) return alert("Оберіть водія");

    if (isIgorDriver && !feeder) {
      return alert("Хто везе до Ігоря?");
    }

    if (!supabase) return;

    await supabase.from("trips").insert([
      {
        driver_id: driver,
        feeder_id: isIgorDriver ? feeder : null,
      },
    ]);

    setDriver("");
    setParticipants([]);
    setFeeder("");

    setToast("🚗 Поїздка додана");

    fetchTrips();
  }

  // ↩️ UNDO
  async function undoLastTrip() {
    if (!supabase) return;

    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      alert("Немає що відміняти");
      return;
    }

    await supabase.from("trips").delete().eq("id", data[0].id);

    fetchTrips();
  }

  const stats = calculateStats(trips);

  // 🧠 SMART RECOMMENDATION
  const nextDriverId = getNextDriverSmart(
    stats,
    availabilityMap,
    currentUser,
    trips
  );

  return (
    <div className="container" style={{ paddingBottom: 100 }}>

      {/* 👤 ЛОГІН */}
      <UserGate users={users} onSelect={setCurrentUser} />

      {/* 🔘 AVAILABILITY */}
      {currentUser && (
        <AvailabilityToggle userId={currentUser} />
      )}

      <h1 style={{ textAlign: "center" }}>🚗 Carpool</h1>

      {/* ВОДІЙ */}
      <div className="card">
        <h3>Водій</h3>

        <select
          className="select"
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
        >
          <option value="">Оберіть</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* УЧАСНИКИ */}
      <div className="card">
        <h3>Учасники</h3>

        {users.map((u) => (
          <label key={u.id} style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={participants.includes(u.id)}
              onChange={() => toggleUser(u.id)}
            />
            <span style={{ marginLeft: 8 }}>{u.name}</span>
          </label>
        ))}
      </div>

      {/* FEEDER */}
      {isIgorDriver && (
        <div className="card">
          <h3>Хто везе до Ігоря</h3>

          {users
            .filter((u) => u.id !== driver)
            .map((u) => (
              <label key={u.id} style={{ display: "block" }}>
                <input
                  type="radio"
                  name="feeder"
                  value={u.id}
                  onChange={(e) => setFeeder(e.target.value)}
                />
                <span style={{ marginLeft: 8 }}>{u.name}</span>
              </label>
            ))}
        </div>
      )}

      {/* КНОПКИ */}
<div
  style={{
    position: "sticky",
    bottom: 80,
    background: "white",
    paddingTop: 10
  }}
>
<button
  onClick={createTrip}
  className="button button-green"
>
  🚀 Зберегти
</button>

<button
  onClick={undoLastTrip}
  className="button button-gray"
>
  ↩️ Відмінити
</button>
</div>

      {/* РЕКОМЕНДАЦІЯ */}
      <div className="card highlight">
        <h3>Рекомендований водій</h3>
        <div style={{ fontSize: 22, fontWeight: "bold" }}>
          {nextDriverId ? getUserName(nextDriverId) : "—"}
        </div>
      </div>

      {/* СТАТИСТИКА */}
      <div className="card">
        <h3>Статистика</h3>

        {Object.entries(stats).map(([userId, s]) => (
          <div
            key={userId}
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{getUserName(userId)}</span>
            <span>🚗 {s.kyiv} | 🚙 {s.feeder}</span>
          </div>
        ))}
      </div>

      {/* ІСТОРІЯ */}
      <div className="card">
        <h3>Останні</h3>

        {trips
          .slice()
          .reverse()
          .slice(0, 5)
          .map((t) => (
            <div key={t.id}>
              🚗 {getUserName(t.driver_id)}
              {t.feeder_id &&
                ` (підвіз: ${getUserName(t.feeder_id)})`}
            </div>
          ))}
      </div>

      {/* 🔔 TOAST */}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}