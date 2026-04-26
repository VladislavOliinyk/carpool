export function getNextDriver(stats: Record<string, { kyiv: number; feeder: number }>) {
  const entries = Object.entries(stats);

  if (entries.length === 0) return null;

  // сортуємо по кількості поїздок на Київ
  const sorted = entries.sort((a, b) => {
    if (a[1].kyiv === b[1].kyiv) {
      // тай-брейкер: менше підвозів → той іде
      return a[1].feeder - b[1].feeder;
    }
    return a[1].kyiv - b[1].kyiv;
  });

  return sorted[0][0]; // user_id
}