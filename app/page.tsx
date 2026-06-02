"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  calculateBalance,
  explainDebt,
  formatTripDate,
  hydrateTrips,
  tripDebtUnit,
  userName,
  type Debt,
  type DebtExplanation,
  type DebtLedger,
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
  const [selectedDebt, setSelectedDebt] = useState<{
    ledger: DebtLedger;
    debt: Debt;
  } | null>(null);

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

  const balance = useMemo(() => calculateBalance(hydratedTrips, users), [hydratedTrips, users]);
  const totalDebt =
    balance.driverDebts.reduce((sum, debt) => sum + debt.count, 0) +
    balance.feederDebts.reduce((sum, debt) => sum + debt.count, 0);
  const latestTrip = hydratedTrips[0];
  const selectedExplanation = selectedDebt
    ? explainDebt(selectedDebt.ledger, selectedDebt.debt, hydratedTrips, users)
    : null;

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
          <span className="logic-version">driver + feeder balance v4</span>
        </div>

        <div className="balance-category">
          <div className="category-title">
            <span>Водійські поїздки</span>
            <small>усі пасажири повертають водієві саме водіння</small>
          </div>
          <div className="debt-stack">
            {loading && <div className="empty-state">Завантажую баланс…</div>}

            {!loading && balance.driverDebts.length === 0 && (
              <div className="empty-state">Водійський баланс рівний.</div>
            )}

            {!loading &&
              balance.driverDebts.map((debt) => (
                <DebtCard
                  key={`driver-${debt.from}-${debt.to}`}
                  debt={debt}
                  onSelect={() => setSelectedDebt({ ledger: "driver", debt })}
                  users={users}
                />
              ))}
          </div>
        </div>

        <div className="balance-category">
          <div className="category-title feeder">
            <span>Feeder-відрізок</span>
            <small>Бориспіль → Олександрівка, тільки між Владом і Дмитром</small>
          </div>
          <div className="debt-stack">
          {loading && <div className="empty-state">Завантажую баланс…</div>}

          {!loading && balance.feederDebts.length === 0 && (
            <div className="empty-state">Feeder-баланс рівний.</div>
          )}

          {!loading &&
            balance.feederDebts.map((debt) => (
              <DebtCard
                key={`feeder-${debt.from}-${debt.to}`}
                debt={debt}
                onSelect={() => setSelectedDebt({ ledger: "feeder", debt })}
                users={users}
              />
            ))}
          </div>
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

      {selectedExplanation && (
        <DebtExplanationSheet
          explanation={selectedExplanation}
          onClose={() => setSelectedDebt(null)}
          users={users}
        />
      )}
    </main>
  );
}

function DebtCard({
  debt,
  onSelect,
  users,
}: {
  debt: Debt;
  onSelect: () => void;
  users: User[];
}) {
  return (
    <button className="debt-card" onClick={onSelect}>
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
    </button>
  );
}

function DebtExplanationSheet({
  explanation,
  onClose,
  users,
}: {
  explanation: DebtExplanation;
  onClose: () => void;
  users: User[];
}) {
  const { debt, ledger, offsetTrips, owedTrips } = explanation;
  const ledgerTitle = ledger === "driver" ? "водійський баланс" : "feeder-відрізок";

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-label="Пояснення боргу"
        className="debt-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div>
            <p>{ledgerTitle}</p>
            <h2>
              {userName(users, debt.from)} винен {userName(users, debt.to)} {debt.count}{" "}
              {tripDebtUnit(debt.count)}
            </h2>
          </div>
          <button aria-label="Закрити пояснення" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="explain-total">
          <span>{owedTrips.length}</span>
          <small>створили борг</small>
          <span>{offsetTrips.length}</span>
          <small>погасили зустрічно</small>
        </div>

        <ExplanationList
          emptyText="Після взаємозаліку не лишилось відкритих дат."
          entries={explanation.outstandingTrips}
          title="Що ще боргує"
          users={users}
        />
      </section>
    </div>
  );
}

function ExplanationList({
  emptyText,
  entries,
  title,
  users,
}: {
  emptyText: string;
  entries: DebtExplanation["owedTrips"];
  title: string;
  users: User[];
}) {
  return (
    <div className="explain-list">
      <h3>{title}</h3>
      {entries.length === 0 && emptyText && <p className="explain-empty">{emptyText}</p>}
      {entries.map((entry) => (
        <article key={`${entry.tripId}-${entry.from}-${entry.to}`}>
          <time>{formatTripDate(entry.createdAt)}</time>
          <span>
            {entry.ledger === "driver"
              ? `${userName(users, entry.to)} віз ${userName(users, entry.from)}`
              : `${userName(users, entry.to)} підвіз ${userName(users, entry.from)}`}
          </span>
        </article>
      ))}
    </div>
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
