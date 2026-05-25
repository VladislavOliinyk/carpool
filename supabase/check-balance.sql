with raw_debts as (
  -- Driver ledger: everyone except the driver owes the driver for the Kyiv segment.
  select
    'driver' as ledger,
    t.feeder_id as from_user_id,
    t.driver_id as to_user_id,
    1 as amount
  from public.trips t
  where t.feeder_id is not null
    and t.feeder_id <> t.driver_id

  union all

  select
    'driver' as ledger,
    tp.user_id as from_user_id,
    t.driver_id as to_user_id,
    1 as amount
  from public.trips t
  join public.trip_participants tp on tp.trip_id = t.id
  where tp.user_id <> t.driver_id
    and (t.feeder_id is null or tp.user_id <> t.feeder_id)

  union all

  -- Feeder ledger: Boryspil -> Oleksandrivka is tracked separately.
  -- It depends on feeder_id only: the other non-driver person received the feeder ride.
  select
    'feeder' as ledger,
    other_user.id as from_user_id,
    t.feeder_id as to_user_id,
    1 as amount
  from public.trips t
  join public.users other_user
    on other_user.id <> t.driver_id
   and other_user.id <> t.feeder_id
  where t.feeder_id is not null
),
grouped as (
  select
    ledger,
    from_user_id,
    to_user_id,
    sum(amount) as amount
  from raw_debts
  where from_user_id is not null
    and to_user_id is not null
    and from_user_id <> to_user_id
  group by ledger, from_user_id, to_user_id
),
pairs as (
  select distinct
    ledger,
    least(from_user_id, to_user_id) as user_a,
    greatest(from_user_id, to_user_id) as user_b
  from grouped
),
net as (
  select
    p.ledger,
    p.user_a,
    p.user_b,
    coalesce(sum(g.amount) filter (where g.from_user_id = p.user_a and g.to_user_id = p.user_b), 0) as a_owes_b,
    coalesce(sum(g.amount) filter (where g.from_user_id = p.user_b and g.to_user_id = p.user_a), 0) as b_owes_a
  from pairs p
  left join grouped g
    on g.ledger = p.ledger
   and (
      (g.from_user_id = p.user_a and g.to_user_id = p.user_b)
      or
      (g.from_user_id = p.user_b and g.to_user_id = p.user_a)
   )
  group by p.ledger, p.user_a, p.user_b
),
final_debts as (
  select
    ledger,
    case when a_owes_b > b_owes_a then user_a else user_b end as from_user_id,
    case when a_owes_b > b_owes_a then user_b else user_a end as to_user_id,
    abs(a_owes_b - b_owes_a) as amount
  from net
  where a_owes_b <> b_owes_a
)
select
  ledger,
  debtor.name as debtor,
  creditor.name as creditor,
  amount
from final_debts
join public.users debtor on debtor.id = final_debts.from_user_id
join public.users creditor on creditor.id = final_debts.to_user_id
order by ledger, amount desc, debtor.name, creditor.name;
