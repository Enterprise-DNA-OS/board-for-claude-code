---
description: "Read the requested change back as fields, rules or stage names"
---

# /customise

Read the requested change back as fields, rules or stage names. Write a new numbered migration without editing applied migrations. Update the CLI whitelist, documentation and tests if needed. Back up records first. Apply the change, exercise it on demo data, and run tests. Do not delete records or widen access.

```bash
node scripts/board.mjs export --out=before-customise.json
npm run migrate
npm test
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
