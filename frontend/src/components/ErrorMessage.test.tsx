import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorMessage from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the error message text', () => {
    render(<ErrorMessage message="Something went wrong" />)

    expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument()
  })

  it('renders close button and calls onClose when clicked', () => {
    const onClose = vi.fn()
    render(<ErrorMessage message="Test error" onClose={onClose} />)

    const button = screen.getByRole('button', { name: /Close error message/i })
    fireEvent.click(button)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
