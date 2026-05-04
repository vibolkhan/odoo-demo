const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    supportFile: 'tests/e2e/support/e2e.{js,jsx}',
    specPattern: 'tests/e2e/specs/**/*.cy.{js,jsx}',
    videosFolder: 'tests/e2e/videos',
    screenshotsFolder: 'tests/e2e/screenshots',
    baseUrl: 'http://localhost:5173',

    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});