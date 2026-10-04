# Board CLI

Run from the project root: `npm run board -- help`. All reads use the configured database. Add `--json` for machine output. Flags use `--field=value`, including values containing spaces as one quoted argument. Dates use YYYY-MM-DD. Reference fields accept names or ids within the board.

## Fields

| Kind | Writable fields |
| --- | --- |
| boards | name, jurisdiction, quorum, pack_days |
| members | board_id, name, role, email, active |
| meetings | board_id, title, meeting_date, status, pack_sent_on, external_id, source_path |
| agenda_items | board_id, meeting_id, title, position, purpose, presenter_id |
| papers | board_id, agenda_item_id, title, owner_id, due_date, received_on, source_path, summary |
| attendance | board_id, meeting_id, member_id, status |
| minutes | board_id, meeting_id, title, body, recorded_on, signed_on, signer_id, source_path |
| decisions | board_id, meeting_id, title, body, decision_date, outcome, external_id, source_path |
| actions | board_id, meeting_id, decision_id, owner_id, title, due_date, status, completed_on, last_update_on, note, external_id, source_path |
| interests | board_id, member_id, title, nature, extent, aware_on, disclosed_on, closed_on, external_id, source_path |
| work_plan | board_id, title, owner_id, due_date, completed_on |
| notes | board_id, title, body |

Boards use name, jurisdiction (NZ-company, AU-company or other), quorum and pack_days. All other records require a board, supplied as `--board=name` or `--board_id=name`. Fields ending in _id reference other records. Optional empty fields can be cleared with the literal value null. A record cannot move to another board.

## Examples

```bash
node scripts/board.mjs add boards --name="Our board" --jurisdiction=NZ-company --quorum=3
node scripts/board.mjs add members --board="Our board" --name="Alex Secretary" --role=Secretary
node scripts/board.mjs add meetings --board="Our board" --title="November review" --meeting_date=2026-11-12
node scripts/board.mjs add actions --board="Our board" --owner_id="Alex Secretary" --title="Collect papers" --due_date=2026-11-05
node scripts/board.mjs update actions "Collect papers" --note="Waiting for finance" --status=in-progress
node scripts/board.mjs complete "Collect papers"
node scripts/board.mjs show meetings "November review" --json
node scripts/board.mjs log "Our board" "Chair asked for the reserves paper first."
```

Actions: open, in-progress, done, cancelled. Completing sets completed_on; reopening clears it. Meetings: planned, held, cancelled. Decisions: pending, approved, declined, deferred. Attendance: present, apology, absent. Agenda purpose: discussion, decision, information.

Signing metadata requires a signer_id from this board and signed_on no earlier than recorded_on. It does not apply an electronic signature. Interests require nature, extent and aware_on. Optional disclosed_on and closed_on cannot predate awareness. Work-plan completion uses completed_on.

## Scope

List commands accept --board=name. Insights deliberately join the entire trusted database. Export covers all twelve record types and rejects a board filter so its scope stays explicit. There is no delete, send, automatic filing or automatic PDF extraction command.

See [the migration guide](replace-boardpro.md) for import layouts and [record checks](compliance.md) for legal sources.
