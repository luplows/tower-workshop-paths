import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { BuyOutPlan } from './BuyOutPlan'

beforeEach(() => {
  window.localStorage.clear()
})

describe('BuyOutPlan', () => {
  it('OQ-8/AC-7: reports coins spent on Labs exceeding lifetime coins and shows no plan', async () => {
    const user = userEvent.setup()
    render(<BuyOutPlan />)
    await user.type(screen.getByLabelText('Lifetime coins'), '100')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '200')
    await user.click(screen.getByRole('button', { name: 'Plan buy-out' }))
    expect(screen.getByRole('alert')).toHaveTextContent('cannot exceed')
    expect(screen.queryByRole('list', { name: 'Buy-out purchases' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Buy-out summary' })).not.toBeInTheDocument()
  })

  it('OQ-8/AC-4, AC-6: shows both views and the budget, spent and left', async () => {
    const user = userEvent.setup()
    render(<BuyOutPlan />)
    await user.type(screen.getByLabelText('Lifetime coins'), '1500')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '500')
    await user.click(screen.getByRole('button', { name: 'Plan buy-out' }))
    expect(screen.getByText(/Budget 1k coins, spent/)).toBeInTheDocument()
    expect(screen.getByText(/budget runs out/)).toBeInTheDocument()
    const purchases = within(screen.getByRole('list', { name: 'Buy-out purchases' }))
    const summary = within(screen.getByRole('list', { name: 'Buy-out summary' }))
    expect(purchases.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(summary.getAllByRole('listitem').length).toBeGreaterThan(0)
  })
})
