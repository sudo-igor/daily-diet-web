/// <reference types="cypress" />

/**
 * Testes de Autenticação do Daily Diet
 *
 * Este arquivo contém testes focados nas funcionalidades de autenticação:
 * - Login
 * - Registro
 * - Logout
 * - Validação de formulários
 */

describe('02. Daily Diet - Autenticação de Usuário', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('A01: Deve exibir a página de login corretamente', () => {
    cy.contains('h2', 'Daily Diet').should('be.visible');
    cy.getByDataTest('email-input').should('be.visible');
    cy.getByDataTest('password-input').should('be.visible');
    cy.getByDataTest('login-button').should('be.visible');
  });

  it('A02: Deve alternar entre formulários de login e registro', () => {
    cy.contains('button', 'Criar Conta').click();
    cy.getByDataTest('firstName-input').should('be.visible');
    cy.getByDataTest('lastName-input').should('be.visible');

    cy.contains('button', 'Entrar').click();
    cy.getByDataTest('firstName-input').should('not.exist');
  });

  it('A03: Deve permitir registro de novo usuário', () => {
    const randomUser = `teste_${Math.floor(
      Math.random() * 100000,
    )}@example.com`;

    cy.contains('button', 'Criar Conta').click();
    cy.getByDataTest('email-input').type(randomUser);
    cy.getByDataTest('password-input').type('123456');
    cy.getByDataTest('firstName-input').type('Usuário');
    cy.getByDataTest('lastName-input').type('Teste');
    cy.getByDataTest('signup-button').click();

    cy.url().should('include', '/home', {timeout: 5000});
  });

  it('A04: Deve permitir login com usuário existente', () => {
    cy.getByDataTest('email-input').type('teste_novo@example.com');
    cy.getByDataTest('password-input').type('123456');
    cy.getByDataTest('login-button').click();

    cy.url().should('include', '/home', {timeout: 5000});
  });

  it('A05: Deve mostrar elementos básicos após login', () => {
    cy.getByDataTest('email-input').type('teste_novo@example.com');
    cy.getByDataTest('password-input').type('123456');
    cy.getByDataTest('login-button').click();

    cy.url().should('include', '/home', {timeout: 5000});
    cy.contains('Daily Diet').should('be.visible');
    cy.contains('Que bom ter você por aqui').should('be.visible');
    cy.getByDataTest('logout-button').should('be.visible');
  });

  it('A06: Deve fazer logout corretamente', () => {
    cy.getByDataTest('email-input').type('teste_novo@example.com');
    cy.getByDataTest('password-input').type('123456');
    cy.getByDataTest('login-button').click();

    cy.url().should('include', '/home', {timeout: 5000});
    cy.getByDataTest('logout-button').click();
    cy.url().should('include', '/login', {timeout: 5000});
  });
});
