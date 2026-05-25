"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import UserGate from "../components/UserGate";
import {
  calculateBalance,
  calculateUserStats,
  hydrateTrips,
  userName,
  type Trip,
  type TripParticipant,
  type User,
} from "../../lib/carpool";

export default function StatsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [, setCurrentUser] = useState<string | null>(null);

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
      setParticipants((participantsResult.data as TripParticipant[]) ?? []);
    }

    loadData();

    if (!supabase) return;

    const client = supabase;
    const channel = client
      .channel("carpool-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_participants" }, loadData)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const hydratedTrips = useMemo(
    () => hydrateTrips(trips, participants),
    [trips, participants]
  );

  const stats = useMemo(
    () => calculateUserStats(users, hydratedTrips),
    [users, hydratedTrips]
  );

  const balance = useMemo(() => calculateBalance(hydratedTrips, users), [hydratedTrips, users]);
  const topDriver = [...stats].sort((a, b) => b.driverTrips - a.driverTrips)[0];
  const totalHandled = hydratedTrips.reduce(
    (sum, trip) => sum + trip.participants.length + (trip.feeder_id ? 1 : 0),
    0
  );
  const activeDebts = balance.driverDebts.length + balance.feederDebts.length;

  return (
    <main className="app-shell">
      <section className="compact-header">
        <div>
          <p>Stats</p>
          <h1>Аналітика справедливості</h1>
        </div>
      </section>

      <UserGate users={users} onSelect={setCurrentUser} />

      <section className="stats-hero">
        <div>
          <span>Лідер водіння</span>
          <strong>{topDriver ? userName(users, topDriver.userId) : "—"}</strong>
        </div>
        <div>
          <span>Людино-поїздок</span>
          <strong>{totalHandled}</strong>
        </div>
        <div>
          <span>Активних боргів</span>
          <strong>{activeDebts}</strong>
        </div>
      </section>

      <section className="stats-list">
        {stats.map((item) => (
          <article className="stat-card" key={item.userId}>
            <div className="stat-title">
              <h2>{userName(users, item.userId)}</h2>
              <span>{item.helpedPeople} допомог</span>
            </div>
            <div className="stat-metrics">
              <div>
                <span>Водій</span>
                <strong>{item.driverTrips}</strong>
              </div>
              <div>
                <span>Пасажир</span>
                <strong>{item.passengerTrips}</strong>
              </div>
              <div>
                <span>Feeder</span>
                <strong>{item.feederTrips}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p>Пояснення</p>
          <h2>Що рахується окремо</h2>
        </div>
        <div className="rules-grid">
          <article>
            <strong>Водій</strong>
            <span>Влад/Дмитро: Бориспіль → Київ через Олександрівку. Ігор: Олександрівка → Київ.</span>
          </article>
          <article>
            <strong>Пасажир</strong>
            <span>Усі, хто не є driver у конкретній поїздці, включно з feeder.</span>
          </article>
          <article>
            <strong>Feeder</strong>
            <span>Окремий відрізок Бориспіль → Олександрівка між Владом і Дмитром.</span>
          </article>
        </div>
      </section>
    </main>
  );
}
