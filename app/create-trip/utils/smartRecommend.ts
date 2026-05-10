type Balance = {
  [userId: string]: {
    [toUserId: string]: number;
  };
};

type Availability = {
  [userId: string]: boolean;
};

type Trip = {
  id: string;
  driver_id: string;
  created_at: string;
};

export function getSmartDriver(
  balance: Balance,
  availability: Availability,
  trips: Trip[]
): string | null {
  const scores: { [userId: string]: number } = {};

  // 1. рахуємо "борги" (скільки винен іншим)
  Object.entries(balance).forEach(([userId, debts]) => {
    let totalDebt = 0;

    Object.values(debts).forEach((amount) => {
      totalDebt += Number(amount);
    });

    scores[userId] = totalDebt;
  });

  // 2. враховуємо availability
  Object.keys(scores).forEach((userId) => {
    if (availability[userId] === false) {
      scores[userId] = -9999; // виключаємо
    }
  });

  // 3. штраф за останню поїздку
  const lastTrip = trips
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )[0];

  if (lastTrip) {
    scores[lastTrip.driver_id] -= 1;
  }

  // 4. вибираємо топ
  const sorted = Object.entries(scores).sort(
    (a, b) => b[1] - a[1]
  );

  return sorted[0]?.[0] || null;
}