import type { DocBlock } from '@ddtds/core'
import { stripHidden } from '@ddtds/core'

export function generateTestFile(mdPath: string, blocks: DocBlock[]): string {
  const headerLines = ["import { test, expect } from 'vitest'"]
  if (blocks.some((b) => b.lang === 'tsx' || b.lang === 'jsx')) {
    headerLines.push("import { render, screen, fireEvent } from '@testing-library/react'")
  }
  const header = headerLines.join('\n') + '\n\n'

  const tests = blocks.map((block) => {
    const name = `${mdPath}:${block.line}`
    const code = stripHidden(block.code)

    if (block.meta.includes('no run') || block.meta.includes('compile fail')) {
      return `test.skip(${JSON.stringify(name)}, async () => {\n${code}\n})`
    }

    if (block.meta.includes('should throw')) {
      return `test(${JSON.stringify(name)}, async () => {\nawait expect(async () => {\n${code}\n}).rejects.toThrow()\n})`
    }

    return `test(${JSON.stringify(name)}, async () => {\n${code}\n})`
  })

  return header + tests.join('\n\n')
}
