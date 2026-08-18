begin;

create type public.job_status as enum (
  'draft', 'open', 'in_discussion', 'assigned', 'closed', 'cancelled'
);
create type public.job_budget_type as enum ('fixed', 'hourly');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_wallet text not null check (client_wallet ~ '^0x[0-9a-fA-F]{40}$'),
  title text not null check (char_length(title) between 5 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null check (char_length(short_description) between 20 and 240),
  description text not null check (char_length(description) between 50 and 8000),
  category text not null check (char_length(category) between 2 and 80),
  skills text[] not null check (cardinality(skills) between 1 and 20),
  budget_amount numeric(24,8) not null check (budget_amount > 0),
  budget_type public.job_budget_type not null,
  currency text not null default 'Test ETH' check (currency = 'Test ETH'),
  deadline timestamptz not null,
  status public.job_status not null default 'draft',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  proposal_count integer not null default 0 check (proposal_count >= 0),
  attachment_metadata jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_attachments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  uploader_wallet text not null check (uploader_wallet ~ '^0x[0-9a-fA-F]{40}$'),
  storage_key text not null unique,
  safe_filename text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size between 1 and 10485760),
  content_hash text not null,
  created_at timestamptz not null default now()
);

create index jobs_status_created_idx on public.jobs (status, created_at desc);
create index jobs_category_created_idx on public.jobs (category, created_at desc);
create index jobs_client_idx on public.jobs (lower(client_wallet), created_at desc);
create index jobs_budget_idx on public.jobs (budget_amount);
create index jobs_deadline_idx on public.jobs (deadline);
create index jobs_public_browse_idx on public.jobs (created_at desc)
  where visibility = 'public' and status = 'open';
create index jobs_search_idx on public.jobs
  using gin (to_tsvector('english', title || ' ' || short_description || ' ' || description));
create index job_attachments_job_idx on public.job_attachments (job_id, created_at);

alter table public.jobs enable row level security;
alter table public.job_attachments enable row level security;

create policy jobs_public_open_read on public.jobs for select
  using (visibility = 'public' and status = 'open');
create policy jobs_owner_read on public.jobs for select
  using (
    lower(client_wallet) = public.request_wallet_address()
  );
create policy jobs_owner_insert on public.jobs for insert
  with check (
    lower(client_wallet) = public.request_wallet_address()
  );
create policy jobs_owner_update on public.jobs for update
  using (
    lower(client_wallet) = public.request_wallet_address()
  )
  with check (
    lower(client_wallet) = public.request_wallet_address()
  );
create policy job_attachments_public_job_read on public.job_attachments for select
  using (exists (
    select 1 from public.jobs j where j.id = job_id
      and j.visibility = 'public' and j.status = 'open'
  ));
create policy job_attachments_owner_read on public.job_attachments for select
  using (lower(uploader_wallet) = public.request_wallet_address());
create policy job_attachments_owner_insert on public.job_attachments for insert
  with check (lower(uploader_wallet) = public.request_wallet_address());

insert into public.jobs
  (id, client_wallet, title, slug, short_description, description, category,
   skills, budget_amount, budget_type, deadline, status, visibility,
   proposal_count, is_demo, created_at)
values
  ('21000000-0000-4000-8000-000000000001','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Build a responsive SaaS marketing website','responsive-saas-marketing-website',
   'Create a polished five-page marketing site for an early-stage operations platform.',
   'We need a production-quality responsive website with a clear homepage, product pages, pricing, FAQ, and contact flow. The implementation should be accessible, fast, and easy for our team to maintain.',
   'Web Development',array['Next.js','TypeScript','Responsive Design','Accessibility'],1.80,'fixed',
   now() + interval '28 days','open','public',3,true,now() - interval '2 hours'),
  ('21000000-0000-4000-8000-000000000002','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Design a fintech mobile onboarding flow','fintech-mobile-onboarding-flow',
   'Design an accessible onboarding and account-verification experience for a finance app.',
   'The project covers user flows, low-fidelity wireframes, high-fidelity mobile screens, reusable components, and a concise handoff document. The visual direction should feel calm, credible, and modern.',
   'Design',array['Figma','UX Design','Design Systems','Prototyping'],0.95,'fixed',
   now() + interval '21 days','open','public',5,true,now() - interval '7 hours'),
  ('21000000-0000-4000-8000-000000000003','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Write a developer-focused product launch guide','developer-product-launch-guide',
   'Produce a clear launch guide explaining a new API product to technical teams.',
   'We need a structured long-form guide covering product positioning, quick start, common workflows, security considerations, and troubleshooting. Writing must be original and technically precise.',
   'Writing',array['Technical Writing','API Documentation','Editing'],0.35,'fixed',
   now() + interval '14 days','open','public',2,true,now() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000004','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Plan a four-week B2B content campaign','b2b-content-campaign',
   'Create a practical content calendar and distribution plan for a B2B software launch.',
   'The campaign should cover audience segments, weekly themes, post concepts, channel selection, measurable objectives, and a reusable reporting template. No paid-media management is required.',
   'Marketing',array['Content Strategy','B2B Marketing','Analytics'],0.18,'hourly',
   now() + interval '24 days','open','public',4,true,now() - interval '2 days'),
  ('21000000-0000-4000-8000-000000000005','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Review a Solidity escrow integration','solidity-escrow-integration-review',
   'Review frontend contract bindings and transaction-state handling for a testnet escrow.',
   'Audit the supplied ABI usage, state decoding, event parsing, transaction simulation, and error handling. Deliver a written findings report and targeted code recommendations; this is not a formal smart-contract audit.',
   'Blockchain',array['Solidity','Viem','Wagmi','EVM'],0.22,'hourly',
   now() + interval '18 days','open','public',6,true,now() - interval '3 days'),
  ('21000000-0000-4000-8000-000000000006','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Edit a 90-second product demonstration','product-demonstration-video-edit',
   'Turn supplied screen recordings and narration into a concise product demo video.',
   'The final edit should include clean pacing, restrained motion graphics, readable captions, audio cleanup, and exports suitable for web and social sharing. Source footage and brand files are provided.',
   'Video Editing',array['Premiere Pro','Motion Graphics','Captions'],0.65,'fixed',
   now() + interval '12 days','open','public',1,true,now() - interval '4 days'),
  ('21000000-0000-4000-8000-000000000007','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Clean and categorize a supplier directory','supplier-directory-data-cleanup',
   'Standardize and validate a spreadsheet containing approximately 2,500 supplier records.',
   'Tasks include removing duplicates, normalizing company names and locations, categorizing suppliers, flagging incomplete entries, and documenting the cleanup rules used.',
   'Data Entry',array['Data Cleaning','Spreadsheets','Research'],0.08,'hourly',
   now() + interval '16 days','open','public',8,true,now() - interval '5 days'),
  ('21000000-0000-4000-8000-000000000008','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Prototype a cross-platform booking app','cross-platform-booking-app-prototype',
   'Build an interactive mobile prototype for scheduling and managing service appointments.',
   'Create the core customer journey for discovery, availability selection, booking, reminders, and cancellation. Deliver tested React Native screens with documented local setup.',
   'Mobile Development',array['React Native','TypeScript','Mobile UX'],1.45,'fixed',
   now() + interval '35 days','open','public',7,true,now() - interval '6 days'),
  ('21000000-0000-4000-8000-000000000009','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Implement accessible dashboard charts','accessible-dashboard-charts',
   'Add responsive, keyboard-accessible charts to an existing analytics dashboard.',
   'Implement four chart views from supplied data contracts, including meaningful text alternatives, loading and empty states, and responsive behavior across tablet and desktop.',
   'Web Development',array['React','Data Visualization','Accessibility'],0.16,'hourly',
   now() + interval '20 days','open','public',2,true,now() - interval '7 days'),
  ('21000000-0000-4000-8000-000000000010','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Create a visual identity for a research newsletter','research-newsletter-identity',
   'Develop a restrained visual identity and reusable publication templates.',
   'Deliver a logo direction, typography and color guidance, newsletter header system, social templates, and practical usage notes. The work should prioritize credibility and readability.',
   'Design',array['Brand Design','Typography','Figma'],0.72,'fixed',
   now() + interval '25 days','open','public',3,true,now() - interval '8 days'),
  ('21000000-0000-4000-8000-000000000011','0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d',
   'Produce six customer case-study interviews','customer-case-study-interviews',
   'Interview six customers and turn their experiences into publishable case studies.',
   'Prepare interview guides, conduct remote interviews, identify verifiable outcomes, and write six concise case studies. Claims must be approved by each participant before delivery.',
   'Writing',array['Interviewing','Case Studies','Copy Editing'],0.12,'hourly',
   now() + interval '30 days','open','public',4,true,now() - interval '9 days'),
  ('21000000-0000-4000-8000-000000000012','0xFC1DC0f5C79a0a47E733476d61209E734a649094',
   'Build a testnet token-gating proof of concept','testnet-token-gating-proof-of-concept',
   'Create a testnet-only proof of concept for wallet-based content access.',
   'Implement wallet connection, read-only token eligibility checks, protected-route UX, clear unsupported-network states, and a concise technical handoff. No production token launch is included.',
   'Blockchain',array['Viem','Wallet Integration','Next.js','EVM'],1.10,'fixed',
   now() + interval '27 days','open','public',5,true,now() - interval '10 days')
on conflict (id) do nothing;

commit;

-- Rollback: drop jobs after exporting any non-demo records, then drop the two
-- job enum types. Phase 21A conversation context columns and history remain.
