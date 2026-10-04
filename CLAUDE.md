# Board for Claude Code: operating instructions

The operator is a board secretary or a trusted governance team. The database is the record, never your memory. Read README.md and docs/cli.md before writes.

## Who this is for

Business, operator and voice: fill these in for your organisation before drafting real correspondence. Demo organisations and people are fictional.

## Routing

| Job | Command |
| --- | --- |
| List the boards and their local rules. | `/boards` |
| Read director and secretary records. | `/members` |
| Read the meeting calendar. | `/meetings` |
| Read the meeting and its agenda, presenters and papers. | `/agenda` |
| Find missing papers, then list their owners and deadlines. | `/paper-chase` |
| Prepare the next meeting cycle | `/meeting-cycle` |
| Show overdue and quiet actions | `/action-chase` |
| Read open actions, their owners and latest notes. | `/actions` |
| Read the decision register | `/decisions` |
| Read current and historical interests | `/interests` |
| Review the annual work plan and owners. | `/work-plan` |
| Check held meetings for missing minutes and signature metadata. | `/minutes-review` |
| Read docs/compliance.md first | `/compliance` |
| Answer one or all of the ten cross-record questions from live data. | `/insights` |
| Read the existing board and referenced records first | `/add` |
| Read the full record first | `/update` |
| Record the operator's exact note | `/log` |
| Mark an action complete only on the operator's instruction, then report its completion date. | `/complete` |
| Write a Monday review from meeting-cycle, attention and compliance | `/weekly-review` |
| Read the action, owner and linked decision from the returned data | `/draft-chase` |
| Read docs/replace-boardpro.md | `/import` |
| Export the whole trusted database to a new file | `/export` |
| Render the meeting pack with its agenda, paper summaries, archive references, actions and interests | `/board-pack` |
| Render minute extracts, interest registers and action notices | `/documents` |
| Render read-only snapshots and give the operator the local files | `/view` |
| Read views.json and the existing database views | `/new-view` |
| Read the requested change back as fields, rules or stage names | `/customise` |


## Rules

- Never send messages. Write drafts locally and let a person send.
- Read the record and linked decision before drafting an action chase.
- Never invent dates, approvals, attendance or signatures. A signed date records evidence, it does not create a signature.
- Match names and ids through the CLI. If ambiguous, list candidates and ask.
- Use only the operator's supplied facts for writes. Keep closed interests and completed actions as history.
- Do not delete records. Destructive database changes require explicit instruction in this session.
- Board filters are not permissions. The database is for one trusted access boundary. Do not join unrelated customer records.
- Read docs/compliance.md before explaining findings. Do not certify compliance.
- Back up records and source archives before schema changes. Write a new migration, apply it and run npm test.
- Stay on main. Do not create branches. Commit source changes without generated records, drafts, database files or secrets.
- Plain words, no em dashes or buzzwords. Say what the data establishes and what is missing.

## Data locations

`DATABASE_URL` selects shared Postgres. Otherwise `DATA_DIR` selects embedded storage (default `.data/db`). `npm run demo` always uses `.data/demo`. Generated reports go to views/ and docs-out/, and drafts to drafts/. Environment files and outputs are gitignored.

Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/boardpro
