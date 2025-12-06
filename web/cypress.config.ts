import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Custom log task for performance metrics
      on('task', {
        log(message) {
          // Filter out hydration warnings from logs
          if (typeof message === 'string' && message.includes('Hydration')) {
            return null
          }
          console.log(message)
          return null
        },
      })
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false, // Disable video for faster runs
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000, // Increase timeout for slow pages
    requestTimeout: 10000,
    responseTimeout: 10000,
    // Optimize for speed
    watchForFileChanges: false, // Disable file watching in headless mode
    chromeWebSecurity: true,
    // Reduce retries for faster failures
    retries: {
      runMode: 1, // Retry once in headless mode
      openMode: 0, // No retries in interactive mode
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
})

