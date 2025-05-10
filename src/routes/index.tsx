import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import { useAuth } from '../contexts/AuthContext';

export default function AppRoutes() {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isLoading ? (
          <div className="min-h-screen bg-star-dust-950 flex items-center justify-center">
            <div className="text-star-dust-50 text-xl">Carregando...</div>
          </div>
        ) : user ? (
          <Navigate to="/home" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="/login" element={
        isLoading ? (
          <div className="min-h-screen bg-star-dust-950 flex items-center justify-center">
            <div className="text-star-dust-50 text-xl">Carregando...</div>
          </div>
        ) : user ? (
          <Navigate to="/home" replace />
        ) : (
          <Login />
        )
      } />
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
