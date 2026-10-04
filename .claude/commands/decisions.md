# /decisions

Read the decision register. Do not infer an approval from discussion.

```bash
node scripts/board.mjs decisions
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
