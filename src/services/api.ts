import axios from 'axios';

console.log(
  'API URL:',
  `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}`,
);

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/${
    import.meta.env.VITE_API_VERSION
  }`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para enviar/receber cookies
});

// Adicionar logs para identificar problemas
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method, config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    // Se for um erro 401, pode ser que o cookie de sessão tenha expirado
    console.error('Response error:', error.response || error);
    if (error.response && error.response.status === 401) {
      console.error('Erro de autenticação:', error.response.data);
    }
    return Promise.reject(error);
  },
);

export default api;
