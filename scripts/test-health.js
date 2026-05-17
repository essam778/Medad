import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function run() {
  console.log('Running tests with coverage (JSON reporter)...\n')

  let result
  try {
    const out = execSync('npm run test:coverage -- --reporter=json 2>/dev/null', {
      cwd: root,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    })
    result = out
  } catch (e) {
    const lines = e.stdout?.split('\n') || []
    const jsonLine = lines.find(l => l.startsWith('{'))
    if (jsonLine) {
      result = jsonLine
    } else {
      console.error('Failed to get test output:', e.message)
      process.exit(1)
    }
  }

  if (!result) {
    console.error('No test output found')
    process.exit(1)
  }

  const data = JSON.parse(result)

  const totalTests = data.numTotalTests || 0
  const passed = data.numPassedTests || 0
  const failed = data.numFailedTests || 0
  const skipped = data.numPendingTests || 0

  const now = new Date()
  const lastRun =
    now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8)

  // Read coverage from vitest's JSON output
  let linesPct = 'N/A'
  let funcsPct = 'N/A'
  let stmtsPct = 'N/A'
  let branchesPct = 'N/A'

  if (data.coverageMap) {
    const totals = data.coverageMap.totals
    if (totals) {
      linesPct = (totals.lines.pct || 0).toFixed(2) + '%'
      funcsPct = (totals.functions.pct || 0).toFixed(2) + '%'
      stmtsPct = (totals.statements.pct || 0).toFixed(2) + '%'
      branchesPct = (totals.branches.pct || 0).toFixed(2) + '%'
    }
  }

  // Try to read from coverage/coverage-summary.json if vitest json doesn't have totals
  if (linesPct === 'N/A') {
    try {
      const summaryPath = resolve(root, 'coverage', 'coverage-summary.json')
      const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))
      const total = summary.total
      if (total) {
        linesPct = (total.lines.pct || 0).toFixed(2) + '%'
        funcsPct = (total.functions.pct || 0).toFixed(2) + '%'
        stmtsPct = (total.statements.pct || 0).toFixed(2) + '%'
        branchesPct = (total.branches.pct || 0).toFixed(2) + '%'
      }
    } catch {
      // fallback
    }
  }

  const check = (val, threshold) => {
    const num = parseFloat(val)
    return isNaN(num) ? '?' : num >= threshold ? '\u2713' : '\u2717'
  }

  console.log('\n\u250c' + '\u2500'.repeat(35) + '\u2510')
  console.log('\u2502' + '     Test Health Report'.padEnd(35) + '\u2502')
  console.log('\u251c' + '\u2500'.repeat(35) + '\u2524')
  console.log(
    '\u2502 Total Tests  \u2502 ' + String(totalTests).padEnd(18) + '\u2502'
  )
  console.log(
    '\u2502 Passing      \u2502 ' + String(passed).padEnd(18) + '\u2502'
  )
  console.log(
    '\u2502 Failing      \u2502 ' + String(failed).padEnd(18) + '\u2502'
  )
  console.log(
    '\u2502 Skipped      \u2502 ' + String(skipped).padEnd(18) + '\u2502'
  )
  console.log('\u251c' + '\u2500'.repeat(35) + '\u2524')
  console.log(
    '\u2502 Lines        \u2502 ' +
      linesPct.padEnd(16) +
      ' ' +
      check(linesPct, 80) +
      ' '.repeat(1) +
      '\u2502'
  )
  console.log(
    '\u2502 Functions    \u2502 ' +
      funcsPct.padEnd(16) +
      ' ' +
      check(funcsPct, 80) +
      ' '.repeat(1) +
      '\u2502'
  )
  console.log(
    '\u2502 Statements   \u2502 ' +
      stmtsPct.padEnd(16) +
      ' ' +
      check(stmtsPct, 80) +
      ' '.repeat(1) +
      '\u2502'
  )
  console.log(
    '\u2502 Branches     \u2502 ' +
      branchesPct.padEnd(16) +
      ' ' +
      check(branchesPct, 80) +
      ' '.repeat(1) +
      '\u2502'
  )
  console.log('\u251c' + '\u2500'.repeat(35) + '\u2524')
  console.log(
    '\u2502 Last Run     \u2502 ' + lastRun.padEnd(18) + '\u2502'
  )
  console.log('\u2514' + '\u2500'.repeat(35) + '\u2518')

  if (failed > 0) {
    console.error(`\n\u2717 ${failed} test(s) FAILED — check output above`)
    process.exit(1)
  }
}

run()
