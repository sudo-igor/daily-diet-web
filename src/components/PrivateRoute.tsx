import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({children}: PrivateRouteProps) {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-star-dust-950 flex items-center justify-center"
        data-test="loading-container">
        <div className="text-star-dust-50 text-xl" data-test="loading-message">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
