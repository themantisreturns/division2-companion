import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const files = [
  ['gear.json', path.join('public', 'data', 'gear.json')],
  ['weapons.json', path.join('public', 'data', 'weapons.json')],
  ['mods.json', path.join('public', 'data', 'mods.json')],
]

let failed = false

for (const [label, filename] of files) {
  try {
    const parsed = JSON.parse(
      await readFile(filename, 'utf8'),
    )

    if (!Array.isArray(parsed)) {
      throw new Error('root value is not an array')
    }

    console.log(
      `✓ ${label}: ${parsed.length} records`,
    )
  } catch (error) {
    failed = true
    console.error(
      `✖ ${label}: ${error.message}`,
    )
  }
}

if (failed) {
  process.exitCode = 1
}
