---
description: "Read docs/compliance.md first"
---

# /compliance

Read docs/compliance.md first. Separate source-backed record checks from constitution policy. Report each finding with its source. No findings means only that these checks found none.

```bash
node scripts/board.mjs compliance --json
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
