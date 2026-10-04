---
description: "Read the existing board and referenced records first"
---

# /add

Read the existing board and referenced records first. Use only facts supplied by the operator. Use the field dictionary in docs/cli.md.

```bash
node scripts/board.mjs add <kind> --board="<board>" --field=value
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
