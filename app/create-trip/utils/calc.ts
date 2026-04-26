type Participant = {
  user_id: string;
  join_point: "boryspil" | "mid";
};

type Trip = {
  driver_id: string;
  participants: Participant[];
  feeder_id?: string;
};

export function calculateTrip(trip: Trip) {
  const BOR_KM = 10;
  const KYIV_KM = 20;

  let results: Record<string, number> = {};

  const all = trip.participants;

  // 🔥 Якщо є підвіз до mid (Ігор водій)
  if (trip.feeder_id) {
    const feeder = trip.feeder_id;

    const others = all
      .filter(p => p.user_id !== trip.driver_id)
      .map(p => p.user_id);

    // СЕГМЕНТ 1
    const share1 = BOR_KM / others.length;

    others.forEach(id => {
      results[id] = (results[id] || 0) + share1;
    });

    results[feeder] = (results[feeder] || 0) + BOR_KM;

    // СЕГМЕНТ 2
    const allIds = all.map(p => p.user_id);
    const share2 = KYIV_KM / allIds.length;

    allIds.forEach(id => {
      results[id] = (results[id] || 0) + share2;
    });

    results[trip.driver_id] =
      (results[trip.driver_id] || 0) + KYIV_KM;

  } else {
    // 🔥 звичайна поїздка
    const total = BOR_KM + KYIV_KM;

    const allIds = all.map(p => p.user_id);
    const share = total / allIds.length;

    allIds.forEach(id => {
      results[id] = (results[id] || 0) + share;
    });

    results[trip.driver_id] =
      (results[trip.driver_id] || 0) + total;
  }

  return results;
}