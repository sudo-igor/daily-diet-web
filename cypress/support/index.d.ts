/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Comando personalizado para selecionar elementos pelo atributo data-test
     * @example cy.getByDataTest('login-button')
     */
    getByDataTest(value: string): Chainable<JQuery<HTMLElement>>;

    /**
     * Comando para fazer login rapidamente
     * @example cy.loginByUI('email@example.com', 'senha123')
     */
    loginByUI(email?: string, password?: string): void;

    /**
     * Comando personalizado para login
     * @example cy.login('email@example.com', 'senha123')
     */
    login(email?: string, password?: string): void;

    /**
     * Comando para registro de novo usuário
     * @example cy.registerUser({ email: 'novo@example.com', password: '123456' })
     */
    registerUser(userData?: Record<string, any>): void;

    /**
     * Comando para garantir que estamos na página home
     * @example cy.ensureHomePage()
     */
    ensureHomePage(): void;

    /**
     * Comando para fazer logout
     * @example cy.logout()
     */
    logout(): void;

    /**
     * Comando para login programático via API
     * @example cy.loginByApi('email@example.com', 'senha123')
     */
    loginByApi(email?: string, password?: string): void;

    /**
     * Comando para verificar se estamos autenticados
     * @example cy.checkIfAuthenticated()
     */
    checkIfAuthenticated(): Chainable<boolean>;

    /**
     * Comando para garantir que o token está presente antes de cada operação que precise de autenticação
     * @example cy.ensureAuthenticated()
     */
    ensureAuthenticated(): void;

    /**
     * Comando simplificado para selecionar elementos pelo atributo data-test (alias de getByDataTest)
     * @example cy.getBySel('login-button')
     */
    getBySel(selector: string, ...args: any[]): Chainable<JQuery<HTMLElement>>;
  }
}
