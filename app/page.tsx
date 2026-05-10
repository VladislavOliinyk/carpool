"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  calculateBalance,
  formatTripDate,
  hydrateTrips,
  tripDebtUnit,
  userName,
  type Debt,
  type HydratedTrip,
  type Trip,
  type TripParticipant,
  type User,
} from "../lib/carpool";

export default function BalancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const [usersResult, tripsResult, participantsResult] = await Promise.all([
        supabase.from("users").select("*").order("name"),
        supabase.from("trips").select("*").order("created_at", { ascending: false }),
        supabase.from("trip_participants").select("*"),
      ]);

      setUsers((usersResult.data as User[]) ?? []);
      setTrips((tripsResult.data as Trip[]) ?? []);
      setParticipants((participantsResult.data as TripParticipant[]) ?? []);
      setLoading(false);
    }

    loadData();

    if (!supabase) return;

    const client = supabase;
    const channel = client
      .channel("carpool-balance")
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

  const debts = useMemo(() => calculateBalance(hydratedTrips), [hydratedTrips]);
  const totalDebt = debts.reduce((sum, debt) => sum + debt.count, 0);
  const latestTrip = hydratedTrips[0];

  return (
    <main className="app-shell">
      <section className="balance-hero">
        <div className="hero-copy">
          <div className="brand-row">
            <span className="logo-mark">C</span>
            <span>Carpool</span>
          </div>
          <h1>Чесний баланс спільних поїздок</h1>
          <p>
            Облік не рахує “таксі”. Він показує, хто реально кого віз: підвіз
            до водія і головну дорогу до Києва.
          </p>
        </div>

        <div className="hero-meter" aria-label="Кількість боргів">
          <span>{totalDebt}</span>
          <small>боргів</small>
        </div>
      </section>

      <section className="quick-actions" aria-label="Швидкі дії">
        <Link className="action-card action-primary" href="/create-trip">
          <span className="action-icon">＋</span>
          <span>
            <strong>Додати поїздку</strong>
            <small>driver, feeder, participants</small>
          </span>
        </Link>
        <Link className="action-card" href="/stats">
          <span className="action-icon">▦</span>
          <span>
            <strong>Статистика</strong>
            <small>водії, пасажири, допомога</small>
          </span>
        </Link>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p>Balance</p>
          <h2>Хто кому винен</h2>
        </div>

        <div className="debt-stack">
          {loading && <div className="empty-state">Завантажую баланс…</div>}

          {!loading && debts.length === 0 && (
            <div className="empty-state">Баланс чистий. Ніхто нікому не винен.</div>
          )}

          {!loading &&
            debts.map((debt) => (
              <DebtCard key={`${debt.from}-${debt.to}`} debt={debt} users={users} />
            ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p>Остання поїздка</p>
          <h2>Історія</h2>
        </div>

        {latestTrip ? (
          <TripPreview trip={latestTrip} users={users} />
        ) : (
          <div className="empty-state">Ще немає поїздок.</div>
        )}
      </section>
    </main>
  );
}

function DebtCard({ debt, users }: { debt: Debt; users: User[] }) {
  return (
    <article className="debt-card">
      <div>
        <span className="person-pill from">{userName(users, debt.from)}</span>
        <p>
          винен <strong>{userName(users, debt.to)}</strong>
        </p>
      </div>
      <div className="debt-count">
        <strong>{debt.count}</strong>
        <span>{tripDebtUnit(debt.count)}</span>
      </div>
    </article>
  );
}

function TripPreview({ trip, users }: { trip: HydratedTrip; users: User[] }) {
  const kyivPassengers = [
    ...(trip.feeder_id ? [trip.feeder_id] : []),
    ...trip.participants,
  ];

  return (
    <article className="trip-preview">
      <time>{formatTripDate(trip.created_at)}</time>
      <div>
        <p>
          <span className="route-badge">Київ</span>
          {userName(users, trip.driver_id)} віз:{" "}
          <strong>{kyivPassengers.map((id) => userName(users, id)).join(", ") || "—"}</strong>
        </p>
        {trip.feeder_id && (
          <p className="support-line">
            Підвіз: {userName(users, trip.feeder_id)} →{" "}
            {trip.participants.map((id) => userName(users, id)).join(", ") || "—"}
          </p>
        )}
      </div>
    </article>
  );
}
