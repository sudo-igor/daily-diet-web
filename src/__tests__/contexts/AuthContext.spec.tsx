import {renderHook, act, waitFor} from '@testing-library/react';
import {AuthProvider, useAuth} from '../../contexts/AuthContext';
import api from '../../services/api';

// Mock do módulo de API
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

// Helper para envolver os hooks nos testes
const wrapper = ({children}: {children: React.ReactNode}) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar mocks padrão
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        users: [
          {
            id: '1',
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            photo_url: 'https://example.com/photo.jpg',
            weight: 70,
            height: 175,
            goal: 'Manter o peso',
          },
        ],
      },
    });
  });

  test('Deve carregar usuário ao inicializar', async () => {
    const {result} = renderHook(() => useAuth(), {wrapper});

    // Inicialmente, o estado de carregamento deve ser true
    expect(result.current.isLoading).toBe(true);

    // Aguardar o carregamento do usuário
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar se o usuário foi carregado
    expect(result.current.user).toEqual({
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      photoUrl: 'https://example.com/photo.jpg',
      weight: 70,
      height: 175,
      goal: 'Manter o peso',
    });
  });

  test('Deve realizar login com sucesso', async () => {
    // Mock para post de login
    (api.post as jest.Mock).mockResolvedValue({data: {success: true}});

    const {result} = renderHook(() => useAuth(), {wrapper});

    // Aguardar o carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Testar o login
    await act(async () => {
      await result.current.signIn({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Verificar se a API foi chamada corretamente
    expect(api.post).toHaveBeenCalledWith('/users/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    // Verificar se o usuário está definido
    expect(result.current.user).not.toBeNull();
  });

  test('Deve realizar cadastro com sucesso', async () => {
    // Mock para post de cadastro
    (api.post as jest.Mock).mockResolvedValue({data: {success: true}});

    const {result} = renderHook(() => useAuth(), {wrapper});

    // Aguardar o carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Testar o cadastro
    await act(async () => {
      await result.current.signUp({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
    });

    // Verificar se a API foi chamada corretamente
    expect(api.post).toHaveBeenCalledWith('/users', {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    });
  });

  test('Deve realizar logout com sucesso', async () => {
    // Mock para post de logout
    (api.post as jest.Mock).mockResolvedValue({data: {success: true}});

    const {result} = renderHook(() => useAuth(), {wrapper});

    // Aguardar o carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar se o usuário está definido inicialmente
    expect(result.current.user).not.toBeNull();

    // Testar o logout
    await act(async () => {
      result.current.signOut();
    });

    // Verificar se a API foi chamada corretamente
    expect(api.post).toHaveBeenCalledWith('/users/logout');

    // Aguardar a mudança de estado
    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});
