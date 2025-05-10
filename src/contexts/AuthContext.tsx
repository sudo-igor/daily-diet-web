import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import api from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  weight?: number;
  height?: number;
  goal?: string;
}

interface AuthContextData {
  user: User | null;
  signIn(credentials: SignInCredentials): Promise<void>;
  signUp(credentials: SignUpCredentials): Promise<void>;
  signOut(): void;
  deleteAccount(): Promise<void>;
  isLoading: boolean;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar o usuário atual
  const loadUser = useCallback(async () => {
    try {
      console.log('Attempting to load user');
      const response = await api.get('/users');
      console.log('Load user response:', response.data);

      if (response.data.users && response.data.users.length > 0) {
        // Formato da resposta quando vem de listAllUsers
        const userData = response.data.users[0];
        console.log('Setting user from array:', userData);
        setUser({
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          photoUrl: userData.photo_url,
          weight: userData.weight,
          height: userData.height,
          goal: userData.goal,
        });
      } else if (response.data.user) {
        // Formato da resposta quando vem de /users com um único usuário
        const userData = response.data.user;
        console.log('Setting user from object:', userData);
        setUser({
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          photoUrl: userData.photo_url,
          weight: userData.weight,
          height: userData.height,
          goal: userData.goal,
        });
      } else {
        // Se não houver usuários, definir como null
        console.log('No user data found, setting to null');
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      // Se houver erro 401, o usuário não está autenticado
      if (
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'status' in error.response &&
        error.response.status === 401
      ) {
        console.log('401 error, user not authenticated');
        setUser(null);
      }
    } finally {
      // Garantir que isLoading seja definido como false após um tempo razoável
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, []);

  // Carregar o usuário ao iniciar a aplicação
  useEffect(() => {
    console.log('Auth provider mounted, loading user');
    loadUser();
  }, [loadUser]);

  const signIn = useCallback(
    async ({email, password}: SignInCredentials) => {
      try {
        console.log('Signing in with:', email);
        setIsLoading(true);
        const response = await api.post('/users/login', {
          email,
          password,
        });
        console.log('Sign in successful, response:', response.data);

        // Se o login retornar o usuário diretamente, vamos definir aqui
        if (response.data.user) {
          const userData = response.data.user;
          setUser({
            id: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            photoUrl: userData.photo_url,
            weight: userData.weight,
            height: userData.height,
            goal: userData.goal,
          });
        } else {
          // Carregar os dados do usuário após o login
          await loadUser();
        }
      } catch (error) {
        console.error('Sign in error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Erro ao fazer login. Tente novamente.');
      } finally {
        // Garantir que isLoading seja definido como false após um tempo razoável
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    },
    [loadUser],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      firstName,
      lastName,
      photoUrl,
    }: SignUpCredentials) => {
      try {
        console.log('Signing up with:', {email, firstName, lastName});
        setIsLoading(true);
        const userData = {
          email,
          password,
          firstName,
          lastName,
          ...(photoUrl && {photoUrl}),
        };

        const response = await api.post('/users', userData);
        console.log('Sign up successful, response:', response.data);

        // Se o cadastro retornar o usuário diretamente, vamos definir aqui
        if (response.data.user) {
          const userData = response.data.user;
          setUser({
            id: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            photoUrl: userData.photo_url,
            weight: userData.weight,
            height: userData.height,
            goal: userData.goal,
          });
        } else {
          // Fazer login após o cadastro
          await signIn({email, password});
        }
      } catch (error) {
        console.error('Sign up error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Erro ao criar conta. Tente novamente.');
      } finally {
        // Garantir que isLoading seja definido como false após um tempo razoável
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    try {
      console.log('Signing out');
      setIsLoading(true);
      await api.post('/users/logout');

      // Definir o usuário como null antes de definir isLoading como false
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, definir o usuário como null
      setUser(null);
    } finally {
      // Garantir que isLoading seja definido como false após um tempo razoável
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      console.log('Deleting account');
      setIsLoading(true);
      await api.delete('/users');

      // Definir o usuário como null antes de definir isLoading como false
      setUser(null);
    } catch (error) {
      console.error('Delete account error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao deletar conta. Tente novamente.');
    } finally {
      // Garantir que isLoading seja definido como false após um tempo razoável
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{user, signIn, signUp, signOut, deleteAccount, isLoading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
