---
description: "Read views.json and the existing database views"
---

# /new-view

Read views.json and the existing database views. Add a read-only SELECT to views.json or a new SQL view in a numbered migration. Never run user-supplied SQL from a web request. Test and render the added view.

```bash
npm run migrate
npm run view
npm test
```

Use the configured database. Add `--json` to board.mjs calls when structured output helps. If a name is ambiguous, list the candidates and ask. Never guess a record or send a message.
