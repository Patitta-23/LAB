# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | ✅ PASS |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | ✅ PASS (requires running DB) |
| 3 | Vitest + jsdom | Heading "TokTickIT" renders on screen | ✅ PASS |
| 4 | Vitest + jsdom | Success state shows Online + category list | ✅ PASS |
| 5 | Vitest + jsdom | Error state shows Offline + error message | ✅ PASS |

## Terminal Output

### Server Tests (with live PostgreSQL on localhost:5432)

```
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 /toktickit/server

 ✓ tests/lab-01/health.test.ts (1)
 ✓ tests/lab-01/categories.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  11:38:08
   Duration  488ms
```

### Client Tests

```
> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 /toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  11:38:09
   Duration  602ms
```

> **Note:** Test #2 is an integration test that requires a running PostgreSQL instance
> (`DATABASE_URL` pointing to a seeded `toktickit` database).
> Run `docker start postgres && npx prisma db seed` before executing `npm test` in the server directory.
