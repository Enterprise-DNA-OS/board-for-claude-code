# Board for Claude Code

Your meeting cycle, decisions, actions and interests in a database you own.
Built by [Enterprise DNA](https://enterprisedna.co).

| Do it yourself | We customise it | We run it for you |
| --- | --- | --- |
| Free under the MIT licence. Install the database and commands. | Your board rules, fields, document layouts and reviewed BoardPro records. A web front end or another stack when you need one. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a monthly retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=boardpro) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=boardpro) |

Works with Claude Code, Codex, OpenCode or Cursor. Read [AGENTS.md](AGENTS.md).

## What is here

Twelve record types cover boards, members, meetings, agendas, papers, attendance, minutes, decisions, actions, interests, work plans and secretary notes. Three database views drive the meeting cycle, action chase and compliance review. Ten analysis queries join these records. There is no front end or external account requirement.

The secretary can prepare an agenda, chase missing papers, record a decision, assign the action and check the outcome at the next meeting. Documents and read-only dashboards carry your business name from `brand.json`.

This base is for a trusted secretary or governance team with access to the entire database. Board filters are convenience filters, not access controls. Use separate databases for boards with different confidentiality boundaries. It does not provide individual director logins, electronic signatures, immutable audit records, notifications or mobile annotation. Enterprise DNA scopes those additions with you.

## Quick start

Node 20 or later, on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/board-for-claude-code.git
cd board-for-claude-code
npm install
npm test
npm run demo
```

The demo creates fictional data in `.data/demo` even if a team database is configured. It never seeds the team database. To explore it with other commands, put `DATA_DIR=.data/demo` in a local `.env` file with no `DATABASE_URL`, or set that environment variable for the process. `npm run migrate` and `npm run seed` use your configured database. Run seed only in a demo database. Seed runs are idempotent and preserve any edited demo rows.

```bash
npm run board -- meeting-cycle
npm run board -- attention
npm run board -- insights 10 --json
npm run view
npm run docs
```

Open `views/week.html`. Documents go to `docs-out/`. These are static snapshots. Regenerate them after changes. A board pack includes paper summaries and archive paths, not merged PDF attachments.

For real records use a fresh `DATA_DIR` and run `npm run migrate`, without seeding. Add your board and members, then import reviewed data. For shared Postgres set `DATABASE_URL` in the environment or a gitignored `.env`. The same migration runs in Postgres and embedded PGlite. Remote connections verify TLS certificates. Keep credentials and confidential records out of Git.

## The commands

| Command | Job |
| --- | --- |
| `/boards` | List the boards and their local rules.. |
| `/members` | Read director and secretary records.. |
| `/meetings` | Read the meeting calendar.. |
| `/agenda` | Read the meeting and its agenda, presenters and papers.. |
| `/paper-chase` | Find missing papers, then list their owners and deadlines.. |
| `/meeting-cycle` | Prepare the next meeting cycle. |
| `/action-chase` | Show overdue and quiet actions. |
| `/actions` | Read open actions, their owners and latest notes.. |
| `/decisions` | Read the decision register. |
| `/interests` | Read current and historical interests. |
| `/work-plan` | Review the annual work plan and owners.. |
| `/minutes-review` | Check held meetings for missing minutes and signature metadata.. |
| `/compliance` | Read docs/compliance.md first. |
| `/insights` | Answer one or all of the ten cross-record questions from live data.. |
| `/add` | Read the existing board and referenced records first. |
| `/update` | Read the full record first. |
| `/log` | Record the operator's exact note. |
| `/complete` | Mark an action complete only on the operator's instruction, then report its completion date.. |
| `/weekly-review` | Write a Monday review from meeting-cycle, attention and compliance. |
| `/draft-chase` | Read the action, owner and linked decision from the returned data. |
| `/import` | Read docs/replace-boardpro.md. |
| `/export` | Export the whole trusted database to a new file. |
| `/board-pack` | Render the meeting pack with its agenda, paper summaries, archive references, actions and interests. |
| `/documents` | Render minute extracts, interest registers and action notices. |
| `/view` | Render read-only snapshots and give the operator the local files. |
| `/new-view` | Read views.json and the existing database views. |
| `/customise` | Read the requested change back as fields, rules or stage names. |

The complete CLI and field dictionary is [docs/cli.md](docs/cli.md). Every direct read supports `--json`. Names match without case sensitivity. Partial ids work. Ambiguous matches list candidates and exit 1. Writes validate relationships within the board. Drafts are local files and never send.

## Ten questions to ask across your own records

These ten answers run today through `npm run board -- insights`. They are custom joins over your records, not a claim that BoardPro can never answer a similar question. Its current product includes document assistance.

1. Which owners carry overdue work across boards?
2. Which approved decisions have no follow-up action?
3. Which upcoming packs are waiting on overdue papers?
4. Which open actions have been quiet for at least fourteen days?
5. Which known interests have no disclosure date?
6. Which held meetings lack a minute record?
7. Which Australian minutes missed their calendar-month deadline?
8. Which meetings have fewer recorded attendees than our quorum?
9. Which work-plan items are overdue or due in the next thirty days?
10. Which directors own overdue actions and have undisclosed interests?

## Your first hour: ten things to ask for

1. Add our board with its jurisdiction and constitution quorum.
2. Add the chair, directors and secretary.
3. Set our board-pack lead time.
4. Add the next meeting and agenda.
5. Assign the missing papers to their presenters.
6. Import our reviewed action list from the archived BoardPro download.
7. Add our current interests and disclosure dates.
8. Record the annual work-plan deadlines.
9. Put our business name and logo on the documents.
10. Add the one field our secretary always keeps in a separate spreadsheet.

Use `/customise` for new fields or rules and `/new-view` for another read-only report. Changes use new migrations and tests.

## Replace BoardPro

BoardPro's documented downloads are PDFs and individual documents. There is no verified native CSV export in this build. Archive those files, transcribe the records you need to the supplied CSV layouts, and have the secretary check them. After that preparation, the import itself is one command:

```bash
node scripts/board.mjs import boardpro --kind=actions --board="Harbour Community Services" --file=examples/boardpro/actions.csv --dry-run
node scripts/board.mjs import boardpro --kind=actions --board="Harbour Community Services" --file=examples/boardpro/actions.csv
```

The example is fictional. Preserve stable External IDs for repeated imports. Meetings, decisions and interests have separate supported layouts. No PDF extraction, attachment transfer or signature migration is claimed. Read [docs/replace-boardpro.md](docs/replace-boardpro.md) before switching. A reviewed transcription takes time, so a complete BoardPro migration is not a one-day guarantee.

## Record checks and documents

`/compliance` flags missing NZ company meeting records and disclosure dates, Australian minute recording deadlines and missing signature metadata, plus your configured quorum. It checks the evidence recorded here, not every legal obligation. [docs/compliance.md](docs/compliance.md) identifies every rule and limit. Other organisation types need their own rules configured. No automatic filing, deletion or certification is included.

`npm run docs` produces board packs, minute extracts, interest registers and action follow-ups. Change `brand.json` once to change their business name, colours and logo. Use an absolute file or HTTPS URL for the logo so nested document paths resolve it. [docs/why-no-front-end.md](docs/why-no-front-end.md) explains the operating limits.

## Architecture and validation

- `scripts/board.mjs`: one CLI, data validation, CSV mapping and ten analysis questions.
- `supabase/migrations/`: portable Postgres migrations, updated timestamps, foreign keys and views.
- `supabase/seed.sql`: fictional records with overdue actions and missing evidence.
- `scripts/smoke.mjs`: temporary embedded database, migrations, seed, all reads and writes, imports, rollback, isolation checks, documents and views.
- `documents.json` and `views.json`: readable report specifications using the shared template renderers.
- `.claude/commands/`: the operator's recurring jobs, used by every runtime.
- `.github/workflows/test.yml`: Node 20/22 on Windows and Linux, plus the same suite against a fresh Postgres 16 test schema.

`npm test` ignores your configured production database. An explicit `BOARD_TEST_POSTGRES_URL` enables the isolated Postgres test schema used in CI. It creates and removes a temporary embedded database. To back up, export records to a new file and back up original source documents separately. The JSON export is an open backup format, not an automatic restore service. Test any recovery procedure before relying on it.

## Ownership

MIT licence. No BoardPro affiliation. Database hosting and coding-agent subscriptions, if used, are separate costs. Enterprise DNA installs and operates your custom version through Omni by Enterprise DNA for one setup fee and then a retainer.

[Talk to Sam for 30 minutes](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=boardpro).
