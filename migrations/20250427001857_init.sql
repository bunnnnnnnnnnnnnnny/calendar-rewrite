create table events (
  id int primary key generated always as identity,

  body text not null,

  created_at timestamptz not null default now()
);

create table event_meta (
  id int primary key generated always as identity,

  event_id int not null references events(id) on delete cascade,

  date date not null
);

create table recurring_event_meta (
  id int primary key generated always as identity,

  event_id int not null references events(id) on delete cascade,

  repeat_start date not null,
  repeat_end date, -- null if infinite

  -- repeat with pattern, null for *
  repeat_year    int,
  repeat_month   int check (repeat_month   >= 0 and repeat_month   <= 11),
  repeat_day     int check (repeat_day     >= 1 and repeat_day     <= 31),
  repeat_week    int,
  repeat_weekday int check (repeat_weekday >= 0 and repeat_weekday <= 6)
);
