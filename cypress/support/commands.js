// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Comando personalizado para selecionar elementos pelo atributo data-test
 *
 * @example cy.getByDataTest('login-button')
 */
Cypress.Commands.add('getByDataTest', (selector) => {
  return cy.get(`[data-test="${selector}"]`);
});

/**
 * Comando para fazer login rapidamente
 */
Cypress.Commands.add(
  'loginByUI',
  (email = 'teste_novo@example.com', password = '123456') => {
    cy.visit('/');
    cy.getByDataTest('email-input').type(email);
    cy.getByDataTest('password-input').type(password);
    cy.getByDataTest('login-button').click();
    cy.url().should('include', '/home', {timeout: 5000});
  },
);

// Comando personalizado para login
Cypress.Commands.add(
  'login',
  (email = 'teste@example.com', password = '123456') => {
    cy.visit('/login');
    cy.get('[data-test="email-input"]').clear().type(email);
    cy.get('[data-test="password-input"]').clear().type(password);
    cy.get('form').submit();

    // Aguardar requisição de login
    cy.wait('@loginRequest').then((interception) => {
      if (interception.response?.statusCode === 200) {
        // Login bem-sucedido
        return true;
      } else {
        // Login falhou
        return false;
      }
    });
  },
);

// Comando para registro de novo usuário
Cypress.Commands.add('registerUser', (userData) => {
  const timestamp = new Date().getTime();
  const defaultData = {
    email: `test_user_${timestamp}@example.com`,
    password: '123456',
    firstName: 'Test',
    lastName: 'User',
  };

  const finalData = {...defaultData, ...userData};

  cy.visit('/login');
  cy.contains('button', 'Criar Conta').click();

  cy.get('[data-test="email-input"]').clear().type(finalData.email);
  cy.get('[data-test="password-input"]').clear().type(finalData.password);
  cy.get('[data-test="firstName-input"]').clear().type(finalData.firstName);
  cy.get('[data-test="lastName-input"]').clear().type(finalData.lastName);

  cy.get('form').submit();

  // Aguardar requisição de registro
  cy.wait('@signupRequest');
});

// Comando para garantir que estamos na página home
Cypress.Commands.add('ensureHomePage', () => {
  cy.url().then((url) => {
    if (!url.includes('/home')) {
      cy.visit('/home');
    }
  });
});

// Comando para fazer logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-test="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Comando para login programático via API
Cypress.Commands.add(
  'loginByApi',
  (email = 'teste@example.com', password = '123456') => {
    // Usar cy.session para preservar o estado de autenticação entre testes
    cy.session(
      [email, password],
      () => {
        // Armazenar a URL base da API
        const apiUrl = `${
          Cypress.env('API_URL') || 'http://localhost:3333'
        }/v1`;

        // Fazer requisição de login diretamente à API
        cy.request({
          method: 'POST',
          url: `${apiUrl}/users/login`,
          body: {
            email,
            password,
          },
          failOnStatusCode: false,
        }).then((response) => {
          // Log do status para debug
          cy.log(`Status da API de login: ${response.status}`);

          if (response.status !== 200) {
            // Login falhou
            cy.log(
              'Login falhou: ' + (response.body?.message || response.status),
            );
            throw new Error('Login failed');
          }
        });
      },
      {
        // Opções da sessão
        validate: () => {
          // Verificar se a sessão ainda é válida
          const apiUrl = `${
            Cypress.env('API_URL') || 'http://localhost:3333'
          }/v1`;

          return cy
            .request({
              method: 'GET',
              url: `${apiUrl}/users`,
              failOnStatusCode: false,
            })
            .then((response) => {
              return response.status === 200;
            });
        },
        cacheAcrossSpecs: true,
      },
    );
  },
);

// Comando para verificar se estamos autenticados
Cypress.Commands.add('checkIfAuthenticated', () => {
  const apiUrl = `${Cypress.env('API_URL') || 'http://localhost:3333'}/v1`;

  cy.request({
    method: 'GET',
    url: `${apiUrl}/users`,
    failOnStatusCode: false,
  }).then((response) => {
    return response.status === 200;
  });
});

// Configurar interceptor de requisições para garantir que os cookies de autenticação sejam enviados
Cypress.on('window:before:load', (win) => {
  // Garantir que todas as requisições axios incluam credenciais
  if (win.axios) {
    win.axios.defaults.withCredentials = true;
  }
});

// Comando para garantir que o token está presente antes de cada operação que precise de autenticação
Cypress.Commands.add('ensureAuthenticated', () => {
  const email = Cypress.env('TEST_USER_EMAIL') || 'teste@example.com';
  const password = Cypress.env('TEST_USER_PASSWORD') || '123456';

  // Tentar usar uma sessão existente ou criar uma nova
  cy.session(
    [email, password],
    () => {
      // Armazenar a URL base da API
      const apiUrl = `${Cypress.env('API_URL') || 'http://localhost:3333'}/v1`;

      // Verificar se já estamos autenticados
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status !== 200) {
          // Não estamos autenticados, fazer login
          cy.log('Não autenticado, tentando login...');
          cy.request({
            method: 'POST',
            url: `${apiUrl}/users/login`,
            body: {
              email,
              password,
            },
            failOnStatusCode: false,
          }).then((loginResponse) => {
            if (loginResponse.status !== 200) {
              throw new Error('Login falhou');
            }
          });
        }
      });
    },
    {
      validate: () => {
        const apiUrl = `${
          Cypress.env('API_URL') || 'http://localhost:3333'
        }/v1`;
        return cy
          .request({
            method: 'GET',
            url: `${apiUrl}/users`,
            failOnStatusCode: false,
          })
          .then((response) => {
            return response.status === 200;
          });
      },
      cacheAcrossSpecs: true,
    },
  );
});
