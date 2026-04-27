import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

test("components.mdx:11", async () => {
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>
}
render(<Greeting name="world" />)
expect(screen.getByText('Hello, world!')).toBeInTheDocument()
})

test("components.mdx:22", async () => {
function SaveButton() {
  return <button type="submit">Save</button>
}
render(<SaveButton />)
expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})

test("components.mdx:35", async () => {
render(<input type="checkbox" aria-label="accept" />)
const box = screen.getByRole('checkbox', { name: 'accept' })
expect(box).not.toBeChecked()
fireEvent.click(box)
expect(box).toBeChecked()
})