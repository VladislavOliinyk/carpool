type Stats = {
  [userId: string]: {
    kyiv: number;
    feeder: number;
  };
};

type Availability = {
  [userId: string]: boolean;
};

export function getNextDriverSmart(
  stats: Stats,
  availability: Availability,
  currentUserId: string | null,
  trips: any[]
): string | null {
  if (!stats) return null;

  // 🚗 останній водій
  const lastDriver = trips.length
    ? trips[trips.length - 1].driver_id
    : null;

  const candidates = Object.entries(stats)
    .filter(([userId]) => {
      // ❌ виключаємо себе
      if (userId === currentUserId) return false;

      // ❌ виключаємо тих, хто не їде
      if (availability[userId] === false) return false;

      // ❌ виключаємо останнього водія
      if (userId === lastDriver) return false;

      return true;
    })
    .sort((a, b) => {
      const scoreA = a[1].kyiv + a[1].feeder;
      const scoreB = b[1].kyiv + b[1].feeder;

      return scoreA - scoreB;
    });

  return candidates[0]?.[0] || null;
}