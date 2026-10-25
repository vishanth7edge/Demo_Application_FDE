---
paths:
  - 'e2e/**'
  - 'playwright.config.ts'
---

# End-to-end tests (Playwright)

- `e2e/baseline/`: behaviour that must always work. Never assert on a seeded defect here; choose
  a path that avoids it (see "Interactions between defects" in `docs/defect-answer-key.md`).
- `e2e/defects/`: one test per seeded defect, named `BUG-0xx <expected behaviour>`. Call
  `seededDefect('BUG-0xx')` first and assert the **expected** behaviour, so the defect makes the
  test fail (an expected failure). Never weaken an assertion to make it pass.
- New defect tests must pass with `BUGGY_STORE_BASELINE=1` on a build without the defect before
  the defect is seeded; that proves the failure is caused by the defect.
- Use the helpers in `e2e/support/fixtures.ts` (`signInAs` for speed, `signIn` to exercise the
  form). The auto fixture resets the database before every test.
- Prefer role/label locators. Labels with a required `*` need a regex such as `/^Price/`.
