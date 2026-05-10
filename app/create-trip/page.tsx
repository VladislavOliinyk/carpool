"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import { Toast } from "../components/Toast";
import UserGate from "../components/UserGate";
import AvailabilityToggle from "../components/AvailabilityToggle";

import { getSmartDriver } from "./utils/smartRecommend";

type User = {
  id: string;
  name: string;
};

export default function CreateTrip() {
  const [users, setUsers] = useState<User[]>([]);
  const [driver, setDriver] = useState<string>("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [recommended, setRecommended] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    if (!supabase) return;

    const { data } = await supabase.from("users").select("*");
    setUsers((data as User[]) || []);
  }

  function toggleParticipant(userId: string) {
    setParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  async function createTrip() {
    if (!supabase) return;

    if (!driver) {
      alert("Обери водія");
      return;
    }

    // 🔥 1. створюємо trip
    const { data, error } = await supabase
      .from("trips")
      .insert([
        {
          driver_id: driver,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      alert("Помилка створення поїздки");
      return;
    }

    const tripId = data.id;

    // 🔥 2. записуємо participants
    if (participants.length > 0) {
      const rows = participants.map(userId => ({
        trip_id: tripId,
        user_id: userId,
      }));

      const { error: pError } = await supabase
        .from("trip_participants")
        .insert(rows);

      if (pError) {
        console.error("participants error", pError);
      }
    }

Toast("🚗 поїздка додана");

    // 🔥 reset
    setDriver("");
    setParticipants([]);
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.name || "—";
  }

  return (
    <div style={{ padding: 16, paddingBottom: 120 }}>

      {/* 👤 USER */}
      <UserGate users={users} onSelect={setCurrentUser} />

      {/* 🔘 AVAILABILITY */}
      {currentUser && (
        <AvailabilityToggle userId={currentUser} />
      )}

      <h1 style={{ margin: "20px 0" }}>🚗 Carpool</h1>

      {/* 🚗 DRIVER */}
      <div style={{ marginBottom: 20 }}>
        <h3>Водій</h3>

        <select
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <option value="">Оберіть</option>

          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* 👥 PARTICIPANTS */}
      <div style={{ marginBottom: 20 }}>
        <h3>Учасники</h3>

        {users.map(u => (
          <label
            key={u.id}
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              checked={participants.includes(u.id)}
              onChange={() => toggleParticipant(u.id)}
            />{" "}
            {u.name}
          </label>
        ))}
      </div>

      {/* 🔘 BUTTONS */}
      <button
        onClick={createTrip}
        style={{
          width: "100%",
          padding: 16,
          background: "#22c55e",
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        🚀 Зберегти
      </button>

      <button
        onClick={() => {
          setDriver("");
          setParticipants([]);
        }}
        style={{
          width: "100%",
          padding: 16,
          background: "#444",
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
        }}
      >
        ↩️ Відмінити
      </button>

      {/* 🧠 RECOMMENDATION (поки базова) */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 16,
          border: "2px solid #22c55e",
          background: "#dcfce7",
        }}
      >
        <h3>Рекомендований водій</h3>

        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {recommended ? getUserName(recommended) : "—"}
        </div>
      </div>
    </div>
  );
}