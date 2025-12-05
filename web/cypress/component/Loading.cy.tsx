/// <reference types="cypress" />
import Loading from '../../src/app/components/Loading'

describe('Loading Component', () => {
  beforeEach(() => {
    // Ensure we have a proper container
    cy.viewport(1280, 720)
  })

  it('should render inline loading by default', () => {
    cy.mount(
      <div>
        <Loading />
      </div>
    )
    cy.get('.loading-inline').should('exist')
    cy.get('.loading-spinner-small').should('exist')
    cy.contains('Loading...')
  })

  it('should render full page loading when fullPage is true', () => {
    cy.mount(
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Loading fullPage />
      </div>
    )
    cy.get('.loading-overlay').should('exist')
    cy.get('.loading-container').should('exist')
    cy.get('.loading-spinner').should('exist')
  })

  it('should display custom message', () => {
    cy.mount(
      <div>
        <Loading message="Custom loading message" />
      </div>
    )
    cy.contains('Custom loading message')
  })

  it('should display custom message in full page mode', () => {
    cy.mount(
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Loading fullPage message="Loading labs..." />
      </div>
    )
    cy.contains('Loading labs...')
    cy.get('.loading-overlay').should('exist')
  })
})

