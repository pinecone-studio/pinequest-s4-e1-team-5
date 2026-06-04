create table if not exists formulas (
  id            uuid primary key default gen_random_uuid(),
  subject       text    not null,
  topic         text    not null,
  wolfram_query text    not null,
  pod_title     text    not null,
  pod_content   text    not null,
  is_seeded     boolean not null default true,
  created_at    timestamptz not null default now(),

  unique (subject, topic, pod_title)
);

create index if not exists formulas_subject_idx on formulas (subject);
create index if not exists formulas_topic_idx   on formulas (subject, topic);