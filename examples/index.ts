/* eslint-disable no-console */
/**
 * Example runner for DiscordDB
 * Usage: tsx examples/index.ts <example-name>
 */

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const exampleName = process.argv[2] || 'insert'
const validExamples = ['insert', 'find', 'update', 'delete']

if (!validExamples.includes(exampleName)) {
  console.error(`❌ Error: Unknown example "${exampleName}"`)
  console.error('\n📚 Available examples:')
  validExamples.forEach(name => console.error(`   - ${name}`))
  console.error('\n💡 Usage: pnpm example <name>')
  console.error('   Example: pnpm example find\n')
  process.exit(1)
}

const examplePath = join(__dirname, `${exampleName}.ts`)

console.log(`\n📚 Running example: ${exampleName}\n`)

const child = spawn('tsx', ['--env-file=.env', examplePath], {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
