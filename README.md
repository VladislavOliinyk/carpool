# Carpool

Mobile-first PWA for a small group that shares rides to Kyiv and keeps a transparent balance of who drove whom.

## Core Logic

Each trip has:

- `driver_id` — the person driving everyone to Kyiv
- `feeder_id` — optional person who brings participants to the driver
- `trip_participants` — passengers collected by the feeder and then carried by the driver

Balance rules:

- `feeder -> driver +1`
- each participant `-> driver +1`
- if feeder exists, each participant `-> feeder +1`
- driver never owes feeder for the feeder stage

The fairness engine is in `lib/carpool.ts`.

## Supabase Schema Note

The existing schema needs `feeder_id` on `trips`:

```sql
alter table public.trips
add column if not exists feeder_id uuid null references public.users(id);
```

If your `users.id` is `text` instead of `uuid`, use:

```sql
alter table public.trips
add column if not exists feeder_id text null;
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
