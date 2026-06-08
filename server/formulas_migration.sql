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

create table if not exists solved_problems (
  id               uuid primary key default gen_random_uuid(),
  grade            integer not null,
  subject          text    not null,
  topic            text    not null,
  original_problem text    not null,
  problem_type     text    not null,
  given_values     jsonb   not null default '[]'::jsonb,
  unknown_value    text    not null,
  formula_used     text    not null,
  why_formula      text    not null,
  solution_steps   jsonb   not null default '[]'::jsonb,
  final_answer     text    not null,
  wolfram_query    text    not null,
  wolfram_result   text    not null,
  wolfram_pods     jsonb   not null default '[]'::jsonb,
  is_verified      boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table solved_problems
add column if not exists wolfram_pods jsonb not null default '[]'::jsonb;

create index if not exists solved_problems_created_at_idx on solved_problems (created_at desc);
create index if not exists solved_problems_subject_idx    on solved_problems (subject);
create index if not exists solved_problems_topic_idx      on solved_problems (topic);
create index if not exists solved_problems_problem_cache_idx
  on solved_problems (subject, lower(btrim(original_problem)));
