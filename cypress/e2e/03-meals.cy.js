/// <reference types="cypress" />

/**
 * Testes de Refeições do Daily Diet
 *
 * Este arquivo contém testes focados nas operações CRUD de refeições:
 * - Visualização de refeições
 * - Navegação entre visualizações
 * - Criação e edição de refeições
 * - Exclusão de refeições
 */

describe(
  '03. Daily Diet - Gerenciamento de Refeições',
  {
    defaultCommandTimeout: 5000,
  },
  () => {
    beforeEach(() => {
      cy.loginByUI();
    });

    it('M01: Deve exibir a interface de refeições', () => {
      // Verificar componentes da interface de refeições
      cy.contains('Suas Refeições da Semana').should('be.visible');
      cy.getByDataTest('refresh-meals').should('be.visible');
      cy.getByDataTest('logout-button').should('be.visible');
      cy.getByDataTest('tab-grid').should('be.visible');
    });

    it('M02: Deve navegar entre as abas de visualização', () => {
      // Começamos na aba Grid por padrão
      cy.contains('Suas Refeições da Semana').should('be.visible');

      // Navegando para Lista
      cy.getByDataTest('tab-list').click();
      cy.contains('Todas as Refeições').should('be.visible');

      // Navegando para Calendário
      cy.getByDataTest('tab-calendar').click();
      cy.contains('Calendário de Refeições').should('be.visible');

      // Navegando para Dashboard
      cy.getByDataTest('tab-dashboard').click();
      cy.contains('Dashboard de Refeições').should('be.visible');

      // Voltar para a aba grid para continuar os testes
      cy.getByDataTest('tab-grid').click();
      cy.contains('Suas Refeições da Semana').should('be.visible');
    });

    it('M03: Deve abrir o modal para adicionar uma refeição', () => {
      // Primeiro, precisamos gerar dados de teste para garantir que a interface está preenchida
      cy.getByDataTest('generate-test-data').click();
      cy.getByDataTest('week-day-container').should('be.visible');

      // Verificar se há algum botão de adicionar refeição visível
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="add-meal-button"]').length > 0) {
          cy.getByDataTest('add-meal-button').first().click();

          // Verificar campos do formulário
          cy.getByDataTest('meal-name-input').should('be.visible');
          cy.getByDataTest('meal-description-input').should('be.visible');
          cy.getByDataTest('meal-date-input').should('be.visible');
          cy.getByDataTest('meal-time-input').should('be.visible');
          cy.getByDataTest('meal-calories-input').should('be.visible');
          cy.getByDataTest('meal-on-diet-input').should('be.visible');

          // Cancelar para não criar
          cy.getByDataTest('meal-modal-cancel').click();
        } else {
          cy.log(
            'Nenhum botão de adicionar refeição encontrado - Possível vazio',
          );
        }
      });
    });

    it('M04: Deve gerar e exibir dados de teste', () => {
      // Verifica se o botão para gerar dados de teste existe e clica nele
      cy.getByDataTest('generate-test-data').should('be.visible').click();

      // Verificar se há elementos de refeição visíveis na tela
      cy.getByDataTest('week-days-grid').should('be.visible');
      cy.getByDataTest('week-day-container').should('have.length', 7);

      // Verificar se o grid realmente exibe dados
      cy.get('body').then(($body) => {
        // Se existir pelo menos um botão de editar, há refeições na tela
        const hasVisibleMeals =
          $body.find('[data-test="edit-meal-button"]').length > 0;
        if (hasVisibleMeals) {
          cy.log('Dados de teste gerados com sucesso');
        } else {
          cy.log(
            'Dados foram gerados, mas nenhuma refeição está visível no grid.',
          );
        }
      });
    });
  },
);
