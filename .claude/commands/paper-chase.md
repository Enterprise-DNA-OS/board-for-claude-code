# /paper-chase

Find missing papers, then list their owners and deadlines.

```bash
node scripts/board.mjs papers --board="<board>"
node scripts/board.mjs meeting-cycle --board="<board>"
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
