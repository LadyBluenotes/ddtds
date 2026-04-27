import { test, expect } from 'vitest'

test("api.md:10", async () => {
const result = [1, 2, 3].map((x) => x * 2)
expect(result).toEqual([2, 4, 6])
})

test("api.md:17", async () => {
const evens = [1, 2, 3, 4, 5].filter((x) => x % 2 === 0)
expect(evens).toEqual([2, 4])
})

test("api.md:24", async () => {
const sum = [1, 2, 3, 4].reduce((acc, x) => acc + x, 0)
expect(sum).toBe(10)
})

test("api.md:33", async () => {
const name = 'world'
expect(`hello ${name}`).toBe('hello world')
})

test("api.md:40", async () => {
const parts = 'a,b,c'.split(',')
expect(parts).toEqual(['a', 'b', 'c'])
})

test("api.md:49", async () => {
const base = { a: 1, b: 2 }
const extended = { ...base, c: 3 }
expect(extended).toEqual({ a: 1, b: 2, c: 3 })
expect(base).toEqual({ a: 1, b: 2 })
})

test("api.md:60", async () => {
const results = await Promise.all([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
])
expect(results).toEqual([1, 2, 3])
})