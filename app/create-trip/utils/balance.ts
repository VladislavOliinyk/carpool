type Trip = {
  id: string;
  driver_id: string;
};

type Participant = {
  trip_id: string;
  user_id: string;
};

type Balance = {
  [userId: string]: {
    [toUserId: string]: number;
  };
};

export function calculateBalance(
  trips: Trip[],
  participants: Participant[]
): Balance {
  const balance: Balance = {};

  // групуємо participants по trip_id
  const map: { [tripId: string]: string[] } = {};

  participants.forEach((p) => {
    if (!map[p.trip_id]) {
      map[p.trip_id] = [];
    }
    map[p.trip_id].push(p.user_id);
  });

  trips.forEach((trip) => {
    const usersInTrip = map[trip.id] || [];

    usersInTrip.forEach((userId) => {
      // пропускаємо водія
      if (userId === trip.driver_id) return;

      if (!balance[userId]) balance[userId] = {};
      if (!balance[userId][trip.driver_id]) {
        balance[userId][trip.driver_id] = 0;
      }

      // пасажир винен водію
      balance[userId][trip.driver_id] += 1;
    });
  });

  return balance;
}