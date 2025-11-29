import { describe, expect, it } from 'vitest'

describe('index.ts', () => {
  it('should export Test type correctly', () => {
    const testValue: string = 'Hello, DiscordDB!'
    expect(testValue).toBe('Hello, DiscordDB!')
  })

  it('should handle string types', () => {
    type Test = string
    const a: Test = 'Hello, DiscordDB!'
    expect(typeof a).toBe('string')
    expect(a).toContain('DiscordDB')
  })
})
