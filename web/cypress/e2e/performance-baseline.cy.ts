/// <reference types="cypress" />

/**
 * BASELINE PERFORMANCE TESTS (Without Lazy Loading)
 * 
 * Run this BEFORE implementing lazy loading to get baseline metrics.
 * Then compare with performance.cy.ts after optimizations.
 * 
 * To use: Temporarily disable lazy loading in page.tsx by changing:
 *   const LabList = dynamic(...)
 * to:
 *   import LabList from "./components/LabList";
 */

describe('Baseline Performance (No Lazy Loading)', () => {
  beforeEach(() => {
    // Clear cookies and local storage for clean test
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should measure homepage load time (baseline)', () => {
    const startTime = Date.now()
    
    cy.visit('/', {
      onBeforeLoad: () => {
        cy.window().then((win) => {
          win.performance.mark('page-start')
        })
      },
    })
    
    cy.get('main').should('be.visible')
    
    cy.window().then((win) => {
      win.performance.mark('page-end')
      win.performance.measure('page-load', 'page-start', 'page-end')
      
      const measure = win.performance.getEntriesByName('page-load')[0] as PerformanceMeasure
      const loadTime = measure.duration
      
      cy.log(`[BASELINE] Homepage load time: ${loadTime.toFixed(2)}ms`)
      
      // Log to console for easy comparison
      cy.task('log', `BASELINE - Homepage: ${loadTime.toFixed(2)}ms`)
    })
  })

  it('should measure login page load time (baseline)', () => {
    cy.visit('/login?role=student')
    
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      
      cy.log(`[BASELINE] Login page load time: ${loadTime.toFixed(2)}ms`)
      cy.task('log', `BASELINE - Login: ${loadTime.toFixed(2)}ms`)
    })
    
    cy.get('.auth-card').should('be.visible')
  })

  it('should measure signup page load time (baseline)', () => {
    cy.visit('/signup?role=student')
    
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      
      cy.log(`[BASELINE] Signup page load time: ${loadTime.toFixed(2)}ms`)
      cy.task('log', `BASELINE - Signup: ${loadTime.toFixed(2)}ms`)
    })
    
    cy.get('.auth-card').should('be.visible')
  })

  it('should measure component render times (baseline)', () => {
    cy.visit('/')
    
    cy.window().then((win) => {
      // Measure time to first contentful paint
      const paintEntries = win.performance.getEntriesByType('paint')
      const fcp = paintEntries.find((entry: PerformanceEntry) => entry.name === 'first-contentful-paint')
      
      if (fcp) {
        cy.log(`[BASELINE] First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`)
        cy.task('log', `BASELINE - FCP: ${fcp.startTime.toFixed(2)}ms`)
      }
      
      // Measure time to interactive
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
      cy.log(`[BASELINE] DOM Content Loaded: ${domContentLoaded.toFixed(2)}ms`)
      cy.task('log', `BASELINE - DCL: ${domContentLoaded.toFixed(2)}ms`)
    })
  })

  it('should measure bundle size (baseline)', () => {
    cy.visit('/')
    
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter((r) => r.name.includes('.js'))
      const totalJsSize = jsResources.reduce((sum, r) => {
        // Transfer size is the actual bytes transferred
        return sum + (r.transferSize || 0)
      }, 0)
      
      cy.log(`[BASELINE] Total JS bundle size: ${(totalJsSize / 1024).toFixed(2)} KB`)
      cy.task('log', `BASELINE - JS Bundle: ${(totalJsSize / 1024).toFixed(2)} KB`)
    })
  })
})

