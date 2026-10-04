# /weekly-review

Write a Monday review from meeting-cycle, attention and compliance. The CLI runs all three and saves a dated review in drafts/. Read it, then give the secretary the priorities.

```bash
node scripts/board.mjs weekly-review --board="<board>"
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
