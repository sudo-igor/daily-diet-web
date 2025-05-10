import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import api from '../services/api';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  weight?: number;
  height?: number;
  goal?: string;
}

export default function Profile() {
  const {user, signOut} = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    weight: 0,
    height: 0,
    goal: 'Manter o peso',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        weight: 0,
        height: 0,
        goal: 'Manter o peso',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
      });
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Meu Perfil</h1>

      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Nome
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) =>
                setProfile({...profile, firstName: e.target.value})
              }
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-test="profile-firstName-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Sobrenome
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) =>
                setProfile({...profile, lastName: e.target.value})
              }
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-test="profile-lastName-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-test="profile-email-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Peso (kg)
              </label>
              <input
                type="number"
                value={profile.weight}
                onChange={(e) =>
                  setProfile({...profile, weight: Number(e.target.value)})
                }
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-test="profile-weight-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Altura (cm)
              </label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) =>
                  setProfile({...profile, height: Number(e.target.value)})
                }
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-test="profile-height-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Objetivo
            </label>
            <select
              value={profile.goal}
              onChange={(e) => setProfile({...profile, goal: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-test="profile-goal-select">
              <option value="Perder peso">Perder peso</option>
              <option value="Manter o peso">Manter o peso</option>
              <option value="Ganhar peso">Ganhar peso</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              data-test="profile-save-button">
              Salvar Alterações
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              data-test="profile-logout-button">
              Sair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
