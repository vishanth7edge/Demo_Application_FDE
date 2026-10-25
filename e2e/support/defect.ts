import { test } from './fixtures.ts'

/**
 * Marks the running test as verifying a seeded defect. The test asserts the EXPECTED behaviour,
 * so with the defect present it fails and Playwright reports it as an expected failure.
 *
 * BUGGY_STORE_BASELINE=1 runs the same tests as ordinary tests, for a build without the seeded
 * defects: they must then pass, which proves each assertion and selector is correct.
 */
export function seededDefect(id: string): void {
  test.info().annotations.push({ type: 'defect', description: id })
  test.fail(
    process.env['BUGGY_STORE_BASELINE'] !== '1',
    `${id} is a seeded defect: this test asserts the expected behaviour`,
  )
}
