import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {PrivateRoute} from '../../components/PrivateRoute';
import {useAuth} from '../../contexts/AuthContext';

// Mock do hook useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('PrivateRoute', () => {
  test('Deve mostrar tela de carregamento quando isLoading=true', () => {
    // Configurar o mock para retornar isLoading=true
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Conteúdo protegido</div>
        </PrivateRoute>
      </MemoryRouter>,
    );

    // Verificar se a tela de carregamento é exibida
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  test('Deve redirecionar para login quando usuário não está autenticado', () => {
    // Configurar o mock para retornar usuário null e isLoading=false
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Página de Login</div>} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>Conteúdo protegido</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Verificar se redirecionou para a página de login
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  test('Deve renderizar conteúdo quando usuário está autenticado', () => {
    // Configurar o mock para retornar usuário autenticado e isLoading=false
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: '1',
        firstName: 'Teste',
        lastName: 'Usuário',
        email: 'teste@exemplo.com',
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Conteúdo protegido</div>
        </PrivateRoute>
      </MemoryRouter>,
    );

    // Verificar se o conteúdo protegido é exibido
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
