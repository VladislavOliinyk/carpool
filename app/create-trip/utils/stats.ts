export function calculateStats(trips: any[]) {
  const stats: Record<string, { kyiv: number; feeder: number }> = {};

  trips.forEach(trip => {
    // 🚗 хто віз на Київ
    if (!stats[trip.driver_id]) {
      stats[trip.driver_id] = { kyiv: 0, feeder: 0 };
    }

    stats[trip.driver_id].kyiv += 1;

    // 🚙 хто підвозив до Ігоря
    if (trip.feeder_id) {
      if (!stats[trip.feeder_id]) {
        stats[trip.feeder_id] = { kyiv: 0, feeder: 0 };
      }

      stats[trip.feeder_id].feeder += 1;
    }
  });

  return stats;
}