import {defineConfig} from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:5173',
    env: {
      API_URL: 'http://localhost:3333',
      API_VERSION: 'v1',
      TEST_USER_EMAIL: 'teste@example.com',
      TEST_USER_PASSWORD: '123456',
    },
    experimentalRunAllSpecs: true,
    experimentalStudio: true,
    watchForFileChanges: true,
    chromeWebSecurity: false, // Permite requisições entre domínios diferentes
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    pageLoadTimeout: 30000,
    responseTimeout: 15000,
    retries: {
      runMode: 2,
      openMode: 1,
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    viewportWidth: 1280,
    viewportHeight: 720,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
