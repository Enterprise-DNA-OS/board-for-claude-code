---
description: "Read docs/replace-boardpro.md"
---

# /import

Read docs/replace-boardpro.md. BoardPro downloads PDFs. The secretary must review a CSV transcription and archive the originals first. Check the dry run, counts, owners and dates before the instructed import.

```bash
node scripts/board.mjs import boardpro --kind=actions --board="<board>" --file=reviewed.csv --dry-run
node scripts/board.mjs import boardpro --kind=actions --board="<board>" --file=reviewed.csv
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
