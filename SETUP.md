# Daily Diet Web - Guia de Configuração

## Sumário
1. [Requisitos](#requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
   - [macOS](#macos)
   - [Windows](#windows)
   - [Linux](#linux)
3. [Desenvolvimento](#desenvolvimento)
4. [Solução de Problemas](#solução-de-problemas)

## Requisitos

Antes de começar, você precisa ter instalado:

- Node.js (versão 16.x ou superior)
- Yarn (versão 1.22.x ou superior)

## Configuração do Ambiente

### macOS

1. Instale as dependências:
```bash
yarn
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

### Windows

1. Instale as dependências:
```batch
yarn
```

2. Configure as variáveis de ambiente:
```batch
copy .env.example .env
```

### Linux

1. Instale as dependências:
```bash
yarn
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
yarn dev
```

O frontend estará disponível em http://localhost:5173

## Solução de Problemas

### Erros Comuns

1. **Porta 5173 em uso**
   - Verifique se não há outro processo usando a porta
   - Altere a porta no arquivo vite.config.ts

2. **Erro ao iniciar o servidor**
   - Verifique se todas as dependências foram instaladas
   - Tente reinstalar com `yarn`

3. **Erro de compilação**
   - Verifique se o TypeScript está instalado corretamente
   - Tente limpar o cache com `yarn cache clean`

### Logs e Debug

Para ver logs mais detalhados:

macOS/Linux:
```bash
DEBUG=* yarn dev
```
Windows:
```batch
set DEBUG=* && yarn dev
```

# Configuração do Ambiente de Desenvolvimento

## Pré-requisitos

- Node.js (versão LTS recomendada)
- Yarn ou npm
- Git

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd daily-diet-web
```

2. Instale as dependências:
```bash
yarn install
# ou
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Ajuste as variáveis conforme necessário

4. Inicie o servidor de desenvolvimento:
```bash
yarn dev
# ou
npm run dev
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── pages/         # Páginas da aplicação
  ├── contexts/      # Contextos do React
  ├── services/      # Serviços (API, etc)
  ├── routes/        # Configuração de rotas
  └── assets/        # Arquivos estáticos
```

## Como Usar a API no Postman

### 1. Autenticação

Para acessar as rotas protegidas da API, você precisa primeiro obter um token de autenticação:

1. Abra o Postman
2. Crie uma nova requisição POST:
   ```
   POST http://localhost:3000/v1/sessions
   ```
3. No corpo da requisição (Body), selecione "raw" e "JSON", então insira:
   ```json
   {
     "email": "seu@email.com",
     "password": "sua_senha"
   }
   ```
4. Envie a requisição
5. A API retornará um token JWT no formato:
   ```json
   {
     "token": "seu_token_jwt",
     "user": {
       "id": "1",
       "name": "Seu Nome",
       "email": "seu@email.com"
     }
   }
   ```

### 2. Usando o Token

Para acessar rotas protegidas:

1. Copie o token recebido
2. Em cada requisição subsequente, adicione o header:
   ```
   Authorization: Bearer seu_token_jwt
   ```

### 3. Exemplos de Requisições

#### Listar Refeições
```
GET http://localhost:3000/v1/meals
Headers:
  Authorization: Bearer seu_token_jwt
```

#### Criar Nova Refeição
```
POST http://localhost:3000/v1/meals
Headers:
  Authorization: Bearer seu_token_jwt
Body (JSON):
{
  "name": "Café da Manhã",
  "description": "Pão com manteiga e café",
  "date": "2024-03-20",
  "is_diet": true
}
```

#### Atualizar Perfil
```
PUT http://localhost:3000/v1/users/profile
Headers:
  Authorization: Bearer seu_token_jwt
Body (JSON):
{
  "name": "Novo Nome",
  "email": "novo@email.com"
}
```

### 4. Dicas para Testes

1. **Coleção do Postman**:
   - Crie uma coleção para organizar suas requisições
   - Use variáveis de ambiente para o token
   - Salve exemplos de respostas para referência

2. **Headers Comuns**:
   ```
   Content-Type: application/json
   Authorization: Bearer seu_token_jwt
   ```

3. **Tratamento de Erros**:
   - 401: Token inválido ou expirado
   - 403: Sem permissão
   - 404: Recurso não encontrado
   - 422: Dados inválidos

4. **Boas Práticas**:
   - Sempre verifique o status code da resposta
   - Use o console do Postman para debug
   - Mantenha seus tokens atualizados
   - Não compartilhe tokens em repositórios públicos

## Scripts Disponíveis

- `yarn dev`: Inicia o servidor de desenvolvimento
- `yarn build`: Gera a versão de produção
- `yarn preview`: Visualiza a versão de produção localmente
- `yarn lint`: Executa o linter
- `yarn test`: Executa os testes

## Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das alterações
3. Envie um Pull Request

## Suporte

Em caso de dúvidas ou problemas, abra uma issue no repositório.
