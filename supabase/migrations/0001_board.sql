create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table boards (
 id uuid primary key default gen_random_uuid(), name text not null unique, jurisdiction text not null check(jurisdiction in ('NZ-company','AU-company','other')),
 quorum integer not null default 2 check(quorum>0), pack_days integer not null default 7 check(pack_days>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table members (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, name text not null, role text not null default 'Director', email text, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(board_id,name), unique(id,board_id)
);
create table meetings (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, title text not null, meeting_date date not null, status text not null default 'planned' check(status in ('planned','held','cancelled')), pack_sent_on date,
 external_id text, source_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(board_id,external_id), unique(id,board_id)
);
create table agenda_items (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, meeting_id uuid not null, title text not null, position integer not null default 1 check(position>0), purpose text not null default 'discussion' check(purpose in ('discussion','decision','information')), presenter_id uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(meeting_id,board_id) references meetings(id,board_id), foreign key(presenter_id,board_id) references members(id,board_id), unique(id,board_id)
);
create table papers (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, agenda_item_id uuid not null, title text not null, owner_id uuid, due_date date not null, received_on date, source_path text, summary text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(agenda_item_id,board_id) references agenda_items(id,board_id), foreign key(owner_id,board_id) references members(id,board_id)
);
create table attendance (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, meeting_id uuid not null, member_id uuid not null, status text not null check(status in ('present','apology','absent')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(meeting_id,board_id) references meetings(id,board_id), foreign key(member_id,board_id) references members(id,board_id), unique(meeting_id,member_id)
);
create table minutes (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, meeting_id uuid not null unique, title text not null, body text not null, recorded_on date not null, signed_on date, signer_id uuid, source_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(meeting_id,board_id) references meetings(id,board_id), foreign key(signer_id,board_id) references members(id,board_id), check(signed_on is null or (signer_id is not null and signed_on>=recorded_on))
);
create table decisions (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, meeting_id uuid, title text not null, body text not null, decision_date date not null, outcome text not null default 'pending' check(outcome in ('pending','approved','declined','deferred')), external_id text, source_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(meeting_id,board_id) references meetings(id,board_id), unique(board_id,external_id), unique(id,board_id)
);
create table actions (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, meeting_id uuid, decision_id uuid, owner_id uuid not null, title text not null, due_date date not null, status text not null default 'open' check(status in ('open','in-progress','done','cancelled')), completed_on date, last_update_on date not null default current_date, note text not null default '', external_id text, source_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(meeting_id,board_id) references meetings(id,board_id), foreign key(decision_id,board_id) references decisions(id,board_id), foreign key(owner_id,board_id) references members(id,board_id), unique(board_id,external_id), check((status='done')=(completed_on is not null))
);
create table interests (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, member_id uuid not null, title text not null, nature text not null, extent text not null, aware_on date not null, disclosed_on date, closed_on date, external_id text, source_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(member_id,board_id) references members(id,board_id), unique(board_id,external_id), check(disclosed_on is null or disclosed_on>=aware_on), check(closed_on is null or closed_on>=aware_on)
);
create table work_plan (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, title text not null, owner_id uuid, due_date date not null, completed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(owner_id,board_id) references members(id,board_id)
);
create table notes (
 id uuid primary key default gen_random_uuid(), board_id uuid not null references boards, title text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['boards','members','meetings','agenda_items','papers','attendance','minutes','decisions','actions','interests','work_plan','notes'] loop execute format('create trigger touch_updated before update on %I for each row execute function touch_updated_at()',t); end loop; end $$;
create index actions_due on actions(board_id,due_date) where status in ('open','in-progress');
create index meetings_date on meetings(board_id,meeting_date);
create view v_action_chase as
 select a.id,a.board_id,b.name as board,a.title,m.name as owner,a.due_date,a.status,current_date-a.due_date as days_overdue,current_date-a.last_update_on as days_quiet,a.note
 from actions a join boards b on b.id=a.board_id join members m on m.id=a.owner_id where a.status in ('open','in-progress');
create view v_pack_readiness as
 select m.id,m.board_id,b.name as board,m.title,m.meeting_date,m.pack_sent_on,m.meeting_date-b.pack_days as pack_due,
 (select count(*)::int from agenda_items ai where ai.meeting_id=m.id) as agenda_count,
 (select count(*)::int from papers p join agenda_items ai on ai.id=p.agenda_item_id where ai.meeting_id=m.id and p.received_on is null) as missing_papers,
 (select count(*)::int from attendance a where a.meeting_id=m.id and a.status='present') as present_count,b.quorum
 from meetings m join boards b on b.id=m.board_id where m.status<>'cancelled';
create view v_compliance as
 select m.board_id,'AU-MINUTE-MONTH'::text as rule,m.title as record,'Minutes missing or recorded after calendar-month deadline'::text as finding,(m.meeting_date+interval '1 month')::date as due_date,
 'https://www.asic.gov.au/about-asic/contact-us/reporting-misconduct-to-asic/disputes-about-access-to-company-information'::text as source
 from meetings m join boards b on b.id=m.board_id left join minutes n on n.meeting_id=m.id
 where b.jurisdiction='AU-company' and m.status='held' and ((n.id is null and current_date>(m.meeting_date+interval '1 month')::date) or n.recorded_on>(m.meeting_date+interval '1 month')::date)
 union all
 select m.board_id,'AU-MINUTE-SIGN',m.title,'Recorded minutes need chair signature review',null::date,'https://www.asic.gov.au/about-asic/contact-us/reporting-misconduct-to-asic/disputes-about-access-to-company-information'
 from meetings m join boards b on b.id=m.board_id join minutes n on n.meeting_id=m.id where b.jurisdiction='AU-company' and m.status='held' and n.signed_on is null
 union all
 select m.board_id,'NZ-MINUTE-RECORD',m.title,'No minute record linked to this held meeting',null::date,'https://www.legislation.govt.nz/act/public/1993/105/en/latest/'
 from meetings m join boards b on b.id=m.board_id left join minutes n on n.meeting_id=m.id where b.jurisdiction='NZ-company' and m.status='held' and m.meeting_date>=current_date-interval '7 years' and n.id is null
 union all
 select i.board_id,'NZ-INTEREST-DISCLOSURE',i.title,'Known interest has no board disclosure date',i.aware_on,'https://www.legislation.govt.nz/act/public/1993/105/en/latest/'
 from interests i join boards b on b.id=i.board_id where b.jurisdiction='NZ-company' and i.disclosed_on is null
 union all
 select m.board_id,'POLICY-QUORUM',m.title,'Recorded attendance is below the configured quorum',m.meeting_date,'Board constitution: configured quorum, not a statutory default'
 from meetings m join v_pack_readiness p on p.id=m.id where m.status='held' and p.present_count<p.quorum;
