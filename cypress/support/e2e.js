// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configurações específicas para o Daily Diet
beforeEach(() => {
  // Interceptar requisições comuns que usamos nos testes
  cy.intercept('POST', '**/login').as('loginRequest');
  cy.intercept('POST', '**/users').as('signupRequest');
  cy.intercept('GET', '**/users').as('getUsersRequest');
  cy.intercept('GET', '**/meals').as('getMealsRequest');
  cy.intercept('POST', '**/meals').as('createMealRequest');
  cy.intercept('PUT', '**/meals/*').as('updateMealRequest');
  cy.intercept('DELETE', '**/meals/*').as('deleteMealRequest');
  cy.intercept('POST', '**/users/logout').as('logoutRequest');
});

// Desativar falhas por exceções não tratadas pela aplicação
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retornar false evita que o Cypress falhe o teste quando a aplicação
  // lança exceções não tratadas
  console.log('Uncaught exception:', err.message);
  return false;
});

// Aumentar o timeout para operações de rede
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 15000);

// Lidar melhor com animações e transições
Cypress.config('animationDistanceThreshold', 50);

// Habilitar retry automático para verificações
Cypress.config('retries', {
  runMode: 2,
  openMode: 1,
});

// Comandos básicos
Cypress.Commands.add('getBySel', (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});
