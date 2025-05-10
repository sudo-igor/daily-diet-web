# Daily Diet Web

Interface web do aplicativo Daily Diet, desenvolvido com React, TypeScript e Vite. Esta aplicação permite que usuários registrem e acompanhem suas refeições, categorize-as como dentro ou fora da dieta, e visualize estatísticas sobre seu progresso.

## 🚀 Recursos

- ✅ Cadastro e autenticação de usuários
- ✅ Registro de refeições (nome, descrição, data, hora, dentro/fora da dieta)
- ✅ Listagem de todas as refeições
- ✅ Estatísticas de progresso
- ✅ Visualização detalhada de refeições
- ✅ Edição e remoção de refeições
- ✅ Layout responsivo (desktop e mobile)

## 🛠️ Tecnologias

- [React](https://react.dev/) - Biblioteca para construção de interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript com tipagem estática
- [Vite](https://vitejs.dev/) - Build tool para desenvolvimento rápido
- [React Router DOM](https://reactrouter.com/) - Roteamento de páginas
- [Axios](https://axios-http.com/) - Cliente HTTP para requisições
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [Recharts](https://recharts.org/) - Biblioteca de gráficos
- [date-fns](https://date-fns.org/) - Biblioteca para manipulação de datas

## 🔧 Pré-requisitos

- Node.js (versão 16.x ou superior)
- Yarn (recomendado) ou npm
- API do Daily Diet rodando localmente

## ⚙️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/ldiasm/daily-diet-web.git
cd daily-diet-web
```

### 2. Instale as dependências
```bash
yarn install
# ou
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo .env.example e renomeie para .env
cp .env.example .env
```

Edite o arquivo `.env` para apontar para o endereço da API:
```
VITE_API_URL=http://localhost:3333
VITE_API_VERSION=
```

### 4. Inicie o servidor de desenvolvimento
```bash
yarn dev
# ou
npm run dev
```
Acesse http://localhost:5173 no seu navegador.

## 📚 Estrutura do Projeto

```
src/
  ├── assets/         # Arquivos estáticos (imagens, ícones)
  ├── components/     # Componentes reutilizáveis
  ├── contexts/       # Contextos React para gerenciamento de estado global
  ├── hooks/          # Custom hooks
  ├── pages/          # Páginas da aplicação
  ├── routes/         # Configuração de rotas
  ├── services/       # Serviços (API, etc)
  └── utils/          # Funções utilitárias
```

## 📝 Scripts Disponíveis

- `yarn dev` - Inicia o servidor de desenvolvimento
- `yarn build` - Compila o projeto para produção
- `yarn lint` - Executa o linter para verificar problemas no código
- `yarn preview` - Visualiza a versão de produção localmente

## 🧪 Testes

### Testes End-to-End com Cypress

1. Instale o Cypress (caso ainda não tenha instalado):
```bash
yarn add -D cypress
```

2. Adicione o script do Cypress ao package.json:
```json
"scripts": {
  "cypress:open": "cypress open"
}
```

3. Execute o Cypress:
```bash
yarn cypress:open
```

4. Para executar testes em modo headless (sem interface gráfica):
```bash
npx cypress run
```

## 📊 Integrando com a API

Esta aplicação web consome a API do Daily Diet. Certifique-se de que a API está rodando antes de iniciar o frontend.

### Sistema de Autenticação com Cookies

O sistema utiliza autenticação baseada em cookies HTTP-only para maior segurança:

```javascript
// src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para enviar/receber cookies
})
```

A opção `withCredentials: true` permite que o Axios envie e receba cookies em requisições cross-origin.

### Exemplo de login com cookies:

```javascript
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  async function handleLogin(email, password) {
    try {
      // A API irá definir o cookie automaticamente
      await api.post('/sessions', { email, password });

      // Não é necessário armazenar token, pois o cookie já está definido
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  }

  // Restante do componente...
}
```

### Fluxo de Autenticação

1. **Login**: O usuário faz login, e a API define um cookie HTTP-only
2. **Requisições Autenticadas**: O cookie é enviado automaticamente em todas as requisições subsequentes
3. **Logout**: O cookie é removido ao fazer logout
4. **Segurança**: Como é um cookie HTTP-only, ele não pode ser acessado por JavaScript, protegendo contra ataques XSS

## 📱 Telas Principais

- **Login** - Autenticação do usuário
- **Cadastro** - Registro de novos usuários
- **Dashboard** - Visão geral com estatísticas
- **Listagem** - Lista de todas as refeições
- **Detalhes** - Informações detalhadas de uma refeição
- **Nova Refeição** - Formulário para adicionar refeição
- **Editar Refeição** - Formulário para editar refeição

## 🐛 Solução de Problemas

### Problemas de conexão com a API
- Verifique se a API está rodando e acessível
- Confirme se o arquivo `.env` está configurado corretamente
- Verifique se o CORS está habilitado no servidor da API e permitindo cookies

### Problemas com cookies de autenticação
- Verifique se `withCredentials: true` está configurado no cliente Axios
- Certifique-se de que o navegador não está bloqueando cookies de terceiros
- Confirme que a API está definindo o cookie corretamente na resposta
- Para desenvolvimento local, certifique-se de que a API e o frontend estão no mesmo domínio (localhost)

### Erro ao instalar dependências
- Tente limpar o cache do yarn: `yarn cache clean`
- Delete node_modules e reinstale: `rm -rf node_modules && yarn install`

### Problemas com TypeScript
- Verifique os erros de compilação no terminal
- Confirme se todas as dependências estão instaladas
- Tente recompilar com `yarn tsc`

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo LICENSE para detalhes.
