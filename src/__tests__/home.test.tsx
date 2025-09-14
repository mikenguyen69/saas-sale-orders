import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /sales order management/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<Home />)
    const welcomeMessage = screen.getByText(
      /welcome to the sales order management saas application/i
    )
    expect(welcomeMessage).toBeInTheDocument()
  })
})
