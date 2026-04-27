import { writeFileSync, chmodSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

const projectRoot = resolve(process.cwd())
const tsx = join(projectRoot, 'node_modules', '.bin', 'tsx')
const cli = join(projectRoot, 'packages', 'cli', 'src', 'index.ts')
const binDir = join(process.env.HOME!, '.local', 'bin')
const binPath = join(binDir, 'ddt')

mkdirSync(binDir, { recursive: true })
writeFileSync(binPath, `#!/bin/sh\nexec "${tsx}" "${cli}" "$@"\n`)
chmodSync(binPath, 0o755)

console.log(`ddt installed → ${binPath}`)
console.log(`Make sure ${binDir} is in your PATH`)
