"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Toast } from "../components/Toast";
import UserGate from "../components/UserGate";
import {
  formatTripDate,
  hydrateTrips,
  userName,
  type HydratedTrip,
  type Trip,
  type TripParticipant,
  type User,
} from "../../lib/carpool";

export default function CreateTrip() {
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripParticipants, setTripParticipants] = useState<TripParticipant[]>([]);
  const [driver, setDriver] = useState("");
  const [feeder, setFeeder] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [, setCurrentUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      const [usersResult, tripsResult, participantsResult] = await Promise.all([
        supabase.from("users").select("*").order("name"),
        supabase.from("trips").select("*").order("created_at", { ascending: false }),
        supabase.from("trip_participants").select("*"),
      ]);

      setUsers((usersResult.data as User[]) ?? []);
      setTrips((tripsResult.data as Trip[]) ?? []);
      setTripParticipants((participantsResult.data as TripParticipant[]) ?? []);
    }

    loadData();

    if (!supabase) return;

    const client = supabase;
    const channel = client
      .channel("carpool-trips")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_participants" }, loadData)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const hydratedTrips = useMemo(
    () => hydrateTrips(trips, tripParticipants),
    [trips, tripParticipants]
  );

  const availableParticipants = users.filter(
    (user) => user.id !== driver && user.id !== feeder
  );

  const availableFeeders = users.filter(
    (user) => user.id !== driver && !participants.includes(user.id)
  );

  function toggleParticipant(userId: string) {
    setParticipants((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function changeDriver(value: string) {
    setDriver(value);
    setFeeder((current) => (current === value ? "" : current));
    setParticipants((current) => current.filter((id) => id !== value));
  }

  function changeFeeder(value: string) {
    setFeeder(value);
    setParticipants((current) => current.filter((id) => id !== value));
  }

  async function createTrip() {
    if (!supabase || saving) return;

    if (!driver) {
      Toast("Обери водія");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("trips")
      .insert([{ driver_id: driver, feeder_id: feeder || null }])
      .select()
      .single();

    if (error || !data) {
      Toast("Не вдалося додати поїздку");
      setSaving(false);
      return;
    }

    const cleanParticipants = Array.from(
      new Set(participants.filter((id) => id !== driver && id !== feeder))
    );
    const newTrip = data as Trip;
    const newParticipantRows = cleanParticipants.map((userId) => ({
      trip_id: newTrip.id,
      user_id: userId,
    }));

    if (cleanParticipants.length > 0) {
      const { error: participantError } = await supabase
        .from("trip_participants")
        .insert(newParticipantRows);

      if (participantError) {
        Toast("Поїздку створено, але учасники не збереглись");
      }
    }

    setTrips((current) => [newTrip, ...current]);
    setTripParticipants((current) => [...current, ...newParticipantRows]);
    setDriver("");
    setFeeder("");
    setParticipants([]);
    setSaving(false);
    Toast("🚗 Поїздка додана");
  }

  return (
    <main className="app-shell">
      <section className="compact-header">
        <div>
          <p>Trips</p>
          <h1>Нова поїздка</h1>
        </div>
      </section>

      <UserGate users={users} onSelect={setCurrentUser} />

      <section className="trip-form">
        <label className="form-field">
          <span>Driver</span>
          <select value={driver} onChange={(event) => changeDriver(event.target.value)}>
            <option value="">Хто везе до Києва?</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Feeder</span>
          <select value={feeder} onChange={(event) => changeFeeder(event.target.value)}>
            <option value="">Без підвозу до водія</option>
            {availableFeeders.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-field">
          <span>Participants</span>
          <div className="participant-grid">
            {availableParticipants.map((user) => (
              <label
                className={`participant-chip ${participants.includes(user.id) ? "selected" : ""}`}
                key={user.id}
              >
                <input
                  checked={participants.includes(user.id)}
                  type="checkbox"
                  onChange={() => toggleParticipant(user.id)}
                />
                <span>{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="logic-note">
          <strong>Як рахується:</strong> feeder і кожен participant винні driver за
          дорогу до Києва. Кожен participant окремо винен feeder за підвіз.
        </div>

        <button className="primary-button" disabled={saving} onClick={createTrip}>
          {saving ? "Зберігаю…" : "Зберегти поїздку"}
        </button>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p>History</p>
          <h2>Останні поїздки</h2>
        </div>

        <div className="history-stack">
          {hydratedTrips.length === 0 && <div className="empty-state">Ще немає поїздок.</div>}
          {hydratedTrips.slice(0, 8).map((trip) => (
            <TripHistoryItem key={trip.id} trip={trip} users={users} />
          ))}
        </div>
      </section>
    </main>
  );
}

function TripHistoryItem({ trip, users }: { trip: HydratedTrip; users: User[] }) {
  const kyivPassengers = [
    ...(trip.feeder_id ? [trip.feeder_id] : []),
    ...trip.participants,
  ];

  return (
    <article className="history-item">
      <time>{formatTripDate(trip.created_at)}</time>
      <div>
        <p>
          <strong>{userName(users, trip.driver_id)}</strong> віз:{" "}
          {kyivPassengers.map((id) => userName(users, id)).join(", ") || "—"}
        </p>
        {trip.feeder_id && (
          <span>
            {userName(users, trip.feeder_id)} підвіз:{" "}
            {trip.participants.map((id) => userName(users, id)).join(", ") || "—"}
          </span>
        )}
      </div>
    </article>
  );
}
