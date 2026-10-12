import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { WorkshopBuyout } from './WorkshopBuyout'

describe('WorkshopBuyout', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows neither a plan nor an error before anything is entered', () => {
    render(<WorkshopBuyout />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Simplified buyout plan' })).not.toBeInTheDocument()
  })

  it('OQ-8/AC-1 + AC-5: states the computed budget and what the plan spends', async () => {
    const user = userEvent.setup()
    render(<WorkshopBuyout />)

    await user.type(screen.getByLabelText('Lifetime coins'), '10000')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '1000')

    expect(screen.getByText(/Budget: 9k coins/)).toBeInTheDocument()
    expect(screen.getByText(/Plan spends/)).toBeInTheDocument()
  })

  it('OQ-8/AC-3: shows both a rollup and a granular view, the rollup grouping consecutive same-upgrade rows', async () => {
    const user = userEvent.setup()
    render(<WorkshopBuyout />)

    await user.type(screen.getByLabelText('Lifetime coins'), '10000000')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '0')

    const rollupList = screen.getByRole('list', { name: 'Simplified buyout plan' })
    const rollupRows = rollupList.querySelectorAll('li')
    const granularRowsBeforeSwitch = screen.queryAllByRole('list', { name: 'Granular buyout plan' })
    expect(granularRowsBeforeSwitch).toHaveLength(0)

    await user.click(screen.getByRole('tab', { name: 'Granular' }))
    const granularList = screen.getByRole('list', { name: 'Granular buyout plan' })
    const granularRows = granularList.querySelectorAll('li')

    // At this budget, this dataset's buy order includes a Workshop upgrade
    // bought across two consecutive batches near the end of the plan (its
    // final, under-sized batch right before it maxes out) -- so the rollup
    // must have strictly fewer rows than the granular sequence it was
    // derived from. "Strictly fewer" is the meaningful claim here: grouping
    // actually happened, not merely "never more rows than", which grouping
    // could never violate even if it grouped nothing at all.
    expect(rollupRows.length).toBeLessThan(granularRows.length)
  })

  it('OQ-8/AC-6: reports coins spent on Labs exceeding lifetime coins, instead of a plan', async () => {
    const user = userEvent.setup()
    render(<WorkshopBuyout />)

    await user.type(screen.getByLabelText('Lifetime coins'), '100')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '200')

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot exceed/i)
    expect(screen.queryByText(/Budget:/)).not.toBeInTheDocument()
  })

  it('OQ-8/AC-8: adding this section does not touch workshopLevels or other existing entry state', async () => {
    const user = userEvent.setup()
    render(<WorkshopBuyout />)

    await user.type(screen.getByLabelText('Lifetime coins'), '10000')
    await user.type(screen.getByLabelText('Coins spent on Labs'), '1000')

    expect(window.localStorage.getItem('workshopLevels')).toBeNull()
    expect(window.localStorage.getItem('enhancementLevels')).toBeNull()
  })
})
