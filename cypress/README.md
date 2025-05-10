# Testes Cypress - Daily Diet Web

Este diretório contém testes automatizados para a aplicação Daily Diet Web.

## Estrutura dos Testes

Os testes estão organizados nos seguintes arquivos:

- `improved-tests.cy.js`: Testes melhorados para autenticação e UI básica
- `meals-tests.cy.js`: Testes para operações CRUD de refeições
- `final-tests.cy.js`: Versão anterior dos testes (funcional)

## Comandos Personalizados

Foram criados vários comandos personalizados para facilitar os testes:

- `cy.login()`: Realiza o login na aplicação
- `cy.registerUser()`: Registra um novo usuário
- `cy.ensureHomePage()`: Garante que estamos na página home
- `cy.logout()`: Realiza o logout da aplicação

## Boas Práticas Implementadas

Os testes foram melhorados seguindo estas boas práticas:

1. **Seletores Robustos**:
   - Utilizamos seletores `data-test` sempre que possível
   - Quando não disponíveis, buscamos por texto ou combinações de seletores

2. **Interceptação de Requisições**:
   - Utilizamos `cy.intercept()` para monitorar requisições à API
   - Implementamos esperas e verificações baseadas nas respostas

3. **Isolamento de Testes**:
   - Cada teste limpa o estado (cookies e localStorage)
   - Os testes são independentes entre si

4. **Tratamento de Redirecionamento**:
   - Implementamos lógica para lidar com falhas de redirecionamento
   - Buscamos elementos de forma resiliente, considerando variações na estrutura da UI

5. **Timeout e Retry**:
   - Aumentamos timeouts para operações de rede
   - Configuramos retries para verificações críticas

## Como Executar os Testes

### Modo Interativo

```bash
npm run cypress:open
```

### Executar Todos os Testes

```bash
npm run cypress:run
```

### Executar Apenas os Testes Melhorados

```bash
npm run cypress:run-improved
```

## Histórias de Usuário Cobertas

- **US001**: Registro de usuário
- **US002**: Login com usuário existente
- **US004**: Visualização da página home
- **US005**: Visualização de refeições
- **US006**: Adição de refeições
- **US007**: Edição de refeições
- **US008**: Exclusão de refeições

## Problemas Conhecidos

1. **Redirecionamento após Login**: Alguns testes podem falhar se o redirecionamento automático após o login não funcionar. Implementamos uma estratégia para navegar manualmente para a página correta se necessário.

2. **Seletores para Refeições**: Muitos elementos na página de refeições não possuem atributos `data-test`, o que torna os seletores mais frágeis. Implementamos estratégias resilientes para encontrar elementos, mas a melhor solução seria adicionar atributos `data-test` adequados aos componentes.

3. **Diálogos de Confirmação**: A exclusão de refeições pode exibir ou não um diálogo de confirmação, então implementamos uma lógica para lidar com ambos os casos.

## Melhorias Futuras

1. Adicionar mais atributos `data-test` ao código da aplicação para facilitar a seleção de elementos
2. Criar fixtures para dados de teste mais complexos
3. Implementar testes end-to-end para fluxos completos de uso da aplicação
4. Melhorar a cobertura de testes para casos de erro e cenários edge cases 