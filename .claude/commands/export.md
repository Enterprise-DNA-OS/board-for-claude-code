# /export

Export the whole trusted database to a new file. Back up referenced source documents separately.

```bash
node scripts/board.mjs export --out=backup.json
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
