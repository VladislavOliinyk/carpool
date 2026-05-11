export type User = {
  id: string;
  name: string;
};

export type Trip = {
  id: string;
  driver_id: string;
  feeder_id?: string | null;
  created_at: string;
};

export type TripParticipant = {
  trip_id: string;
  user_id: string;
};

export type HydratedTrip = Trip & {
  participants: string[];
};

export type Debt = {
  from: string;
  to: string;
  count: number;
};

export type BalanceSummary = {
  driverDebts: Debt[];
  feederDebts: Debt[];
};

export type UserStats = {
  userId: string;
  driverTrips: number;
  passengerTrips: number;
  feederTrips: number;
  helpedPeople: number;
};

const addDebt = (ledger: Map<string, Debt>, from: string, to: string) => {
  if (!from || !to || from === to) return;

  const key = `${from}->${to}`;
  const existing = ledger.get(key);

  ledger.set(key, {
    from,
    to,
    count: (existing?.count ?? 0) + 1,
  });
};

export const userName = (users: User[], id: string) => {
  return users.find((user) => user.id === id)?.name ?? "—";
};

export const hydrateTrips = (
  trips: Trip[],
  participants: TripParticipant[]
): HydratedTrip[] => {
  const participantsByTrip = new Map<string, string[]>();

  participants.forEach((participant) => {
    const current = participantsByTrip.get(participant.trip_id) ?? [];
    participantsByTrip.set(participant.trip_id, [...current, participant.user_id]);
  });

  return trips
    .map((trip) => {
      const cleanParticipants = Array.from(
        new Set(
          (participantsByTrip.get(trip.id) ?? []).filter(
            (userId) => userId !== trip.driver_id && userId !== trip.feeder_id
          )
        )
      );

      return {
        ...trip,
        feeder_id: trip.feeder_id && trip.feeder_id !== trip.driver_id ? trip.feeder_id : null,
        participants: cleanParticipants,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const calculateDriverBalance = (trips: HydratedTrip[]): Debt[] => {
  const ledger = new Map<string, Debt>();

  trips.forEach((trip) => {
    if (trip.feeder_id) {
      addDebt(ledger, trip.feeder_id, trip.driver_id);
    }

    trip.participants.forEach((participantId) => {
      addDebt(ledger, participantId, trip.driver_id);

    });
  });

  return settleMutualDebts(Array.from(ledger.values())).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`, "uk");
  });
};

export const calculateFeederBalance = (trips: HydratedTrip[]): Debt[] => {
  const ledger = new Map<string, Debt>();

  trips.forEach((trip) => {
    if (!trip.feeder_id) return;

    trip.participants.forEach((participantId) => {
      addDebt(ledger, participantId, trip.feeder_id as string);
    });
  });

  return settleMutualDebts(Array.from(ledger.values())).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`, "uk");
  });
};

export const calculateBalance = (trips: HydratedTrip[]): BalanceSummary => {
  return {
    driverDebts: calculateDriverBalance(trips),
    feederDebts: calculateFeederBalance(trips),
  };
};

export const settleMutualDebts = (debts: Debt[]): Debt[] => {
  const raw = new Map<string, number>();
  const pairs = new Set<string>();

  debts.forEach((debt) => {
    raw.set(`${debt.from}->${debt.to}`, (raw.get(`${debt.from}->${debt.to}`) ?? 0) + debt.count);
    pairs.add([debt.from, debt.to].sort().join("<->"));
  });

  return Array.from(pairs).flatMap((pair) => {
    const [first, second] = pair.split("<->");
    const firstOwesSecond = raw.get(`${first}->${second}`) ?? 0;
    const secondOwesFirst = raw.get(`${second}->${first}`) ?? 0;
    const diff = firstOwesSecond - secondOwesFirst;

    if (diff > 0) {
      return [{ from: first, to: second, count: diff }];
    }

    if (diff < 0) {
      return [{ from: second, to: first, count: Math.abs(diff) }];
    }

    return [];
  });
};

export const calculateUserStats = (users: User[], trips: HydratedTrip[]): UserStats[] => {
  const stats = new Map<string, UserStats>(
    users.map((user) => [
      user.id,
      {
        userId: user.id,
        driverTrips: 0,
        passengerTrips: 0,
        feederTrips: 0,
        helpedPeople: 0,
      },
    ])
  );

  trips.forEach((trip) => {
    const driver = stats.get(trip.driver_id);
    if (driver) {
      driver.driverTrips += 1;
      driver.helpedPeople += trip.participants.length + (trip.feeder_id ? 1 : 0);
    }

    if (trip.feeder_id) {
      const feeder = stats.get(trip.feeder_id);
      if (feeder) {
        feeder.feederTrips += 1;
        feeder.passengerTrips += 1;
        feeder.helpedPeople += trip.participants.length;
      }
    }

    trip.participants.forEach((participantId) => {
      const participant = stats.get(participantId);
      if (participant) {
        participant.passengerTrips += 1;
      }
    });
  });

  return Array.from(stats.values());
};

export const formatTripDate = (value: string) => {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
};

export const tripDebtUnit = (count: number) => {
  if (count === 1) return "поїздку";
  if (count > 1 && count < 5) return "поїздки";
  return "поїздок";
};
