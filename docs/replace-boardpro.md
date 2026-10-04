# Moving from BoardPro

Checked 4 October 2026. The importer loads reviewed CSV transcriptions. It does not parse PDF files or claim that BoardPro has a native CSV export.

## Get the records out

1. Have an authorised administrator enable downloading if the board permits it. Download meeting agendas, packs, minutes and governance documents before ending the subscription.
2. From Actions, download the current action list as PDF. Include completed history separately if the board needs it.
3. From Decisions, choose the date/type/outcome filters and export the decision register PDF.
4. From Interests Register, download both current and historical interests as needed.
5. Put the originals in a controlled archive. Keep source filenames and stable identifiers in your transcription. Preserve signed originals separately.

Official sources: [action list](https://help.boardpro.io/en/articles/10717278-action-list-page), [decision register download](https://help.boardpro.io/en/articles/10297236-download-the-decision-register), [interests register](https://help.boardpro.io/en/articles/11089008-interests-register), [cancellation and manual download checklist](https://help.boardpro.io/en/articles/14897561-how-do-i-cancel-my-boardpro-subscription).

## Review the transcription

Use examples/boardpro/*.csv as the layouts, not as claims of native vendor headers. A person checks each record against its original PDF. Use dates as YYYY-MM-DD, not ambiguous local dates. Assign a stable External ID within each board and record kind. Source contains the original archive path, which is stored as text. The importer neither reads nor copies that file.

Create the board and members first. Import meetings before decisions or actions that refer to meetings. Names match within the selected board. An unknown or ambiguous owner stops the import. One invalid record rolls back the entire file, including when a later record fails.

| Kind | Required CSV columns | Optional columns |
| --- | --- | --- |
| actions | External ID, Title, Owner, Due date, Source | Status, Note, Meeting, Decision, Completed, Updated |
| meetings | External ID, Title, Date, Source | Status |
| decisions | External ID, Title, Date, Text, Source | Outcome, Meeting |
| interests | External ID, Title, Member, Nature, Extent, Aware, Source | Disclosed, Closed |

Action statuses are open, in-progress, done and cancelled. Done requires Completed. Meeting statuses are planned, held and cancelled. Decision outcomes are pending, approved, declined and deferred. Record missing information as missing and resolve it before import rather than inventing a date or owner. Multiple BoardPro owners require a deliberate choice of accountable owner for the base's one-owner action, with the other names preserved in Note.

```bash
node scripts/board.mjs import boardpro --kind=actions --board="Your board" --file=reviewed-actions.csv --dry-run
node scripts/board.mjs import boardpro --kind=actions --board="Your board" --file=reviewed-actions.csv
```

Use the same invocation with kind meetings, decisions or interests for the other layouts. The dry run executes all database checks and rolls back. Repeating a load updates the same board/kind/External ID; it does not create duplicates. Omitted optional meeting links preserve existing links on subsequent updates; supplied fields replace their prior values. Keep reviewed import files as the audit trail.

## What stays in the archive

PDF bodies, signatures, annotations, votes, permissions, attachments, activity histories and document versions do not become structured records automatically. Add minute text and signature metadata through the CLI only after checking originals. BoardPro account permissions are not recreated. There is no automatic extraction or automatic cancellation.

Compare record counts, owners, dates and source references with the original downloads. Run one full meeting cycle side by side. Keep originals accessible after switching. A one-command load follows reviewed preparation; the full migration time depends on the size and quality of the archive. Enterprise DNA handles the mapping and review as part of a custom installation.
