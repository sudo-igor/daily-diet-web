import {useState, useEffect, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  parseISO,
} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {generateWeeklyMeals} from '../utils/mockData';
import DashboardTab from '../components/DashboardTab';

// Configuração da API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/${
  import.meta.env.VITE_API_VERSION
}`;
const API_TIMEOUT = 10000; // 10 segundos

// Headers comuns para todas as requisições
const commonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Função auxiliar para fazer requisições com timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        ...commonHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'A requisição demorou muito para responder. Por favor, tente novamente.',
        );
      }
      throw error;
    }
    throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
  } finally {
    clearTimeout(timeoutId);
  }
};

interface Meal {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  onDiet: boolean;
  on_diet?: number;
  calories?: number;
}

interface DailyMeals {
  date: Date;
  meals: Meal[];
}

interface MealModification {
  id: string;
  type: 'create' | 'update' | 'delete';
  meal: Meal;
  timestamp: Date;
}

export default function Home() {
  const {user, signOut, deleteAccount, isLoading} = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'grid' | 'list' | 'calendar' | 'dashboard'
  >('grid');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weeklyMeals, setWeeklyMeals] = useState<DailyMeals[]>([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modificationHistory, setModificationHistory] = useState<
    MealModification[]
  >([]);
  const [showModificationHistory, setShowModificationHistory] = useState(false);
  const [newMeal, setNewMeal] = useState<Omit<Meal, 'id'>>({
    name: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    onDiet: true,
    calories: undefined,
  });
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError('');
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao deletar conta. Tente novamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verificar se a data é futura
      const selectedDate = new Date(newMeal.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas as datas

      if (selectedDate > today) {
        alert('Não é possível adicionar refeições para datas futuras.');
        return;
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/meals`, {
        method: 'POST',
        body: JSON.stringify({
          name: newMeal.name,
          description: newMeal.description,
          date: newMeal.date,
          time: newMeal.time,
          onDiet: Boolean(newMeal.onDiet),
          calories: newMeal.calories || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      // Fecha o modal e limpa o formulário
      setShowAddMealModal(false);
      setNewMeal({
        name: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        onDiet: false,
        calories: undefined,
      });

      // Recarrega todas as refeições para garantir que a lista esteja atualizada
      await loadMealsForWeek();
    } catch (error) {
      console.error('Error adding meal:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao adicionar refeição. Tente novamente.',
      );
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    // Corrigir a conversão de data
    try {
      // A data vem em formato ISO como '2025-04-06T00:00:00.000Z'
      // Primeiro extraímos apenas a parte da data
      const dateOnly = meal.date.split('T')[0];
      // Depois convertemos para um objeto Date usando parseISO
      const mealDate = parseISO(dateOnly);
      setSelectedDate(mealDate);

      console.log('Data da refeição:', meal.date);
      console.log('Data extraída:', dateOnly);
      console.log('Data parseada:', mealDate);
    } catch (error) {
      console.error('Erro ao converter data:', error);
      // Fallback manual se parseISO falhar
      const [year, month, day] = meal.date.split('T')[0].split('-').map(Number);
      const mealDate = new Date(year, month - 1, day);
      setSelectedDate(mealDate);
    }

    setNewMeal({
      name: meal.name,
      description: meal.description,
      date: meal.date.split('T')[0], // Garantir que estamos usando apenas a data sem timezone
      time: meal.time,
      onDiet: meal.onDiet,
      calories: meal.calories || 0,
    });

    setShowAddMealModal(true);
  };

  const handleUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeal) return;

    try {
      // Verificar se a data é futura
      const selectedDate = new Date(newMeal.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas as datas

      if (selectedDate > today) {
        alert('Não é possível adicionar refeições para datas futuras.');
        return;
      }

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/meals/${selectedMeal.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: newMeal.name,
            description: newMeal.description,
            date: newMeal.date,
            time: newMeal.time,
            onDiet: newMeal.onDiet,
            calories: newMeal.calories || undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update meal');
      }

      // Fecha o modal e limpa a seleção
      setShowAddMealModal(false);
      setSelectedMeal(null);

      // Recarrega todas as refeições para garantir que a lista esteja atualizada
      await loadMealsForWeek();
    } catch (error) {
      console.error('Error updating meal:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar refeição. Tente novamente.',
      );
    }
  };

  const handleDeleteMeal = async (meal: Meal) => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/meals/${meal.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Erro ao deletar refeição');
      }

      // Adiciona ao histórico local
      setModificationHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'delete',
          meal,
          timestamp: new Date(),
        },
      ]);

      // Recarrega todas as refeições para garantir que a lista esteja atualizada
      await loadMealsForWeek();
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao deletar refeição. Tente novamente.',
      );
    }
  };

  const handleOpenAddMealModal = (date: Date) => {
    setSelectedDate(date);
    // Usando a data exata que foi passada para o modal
    const formattedDate = format(date, 'yyyy-MM-dd');
    console.log('Data selecionada:', formattedDate); // Para debug
    setNewMeal({
      name: '',
      description: '',
      date: formattedDate,
      time: format(new Date(), 'HH:mm'),
      onDiet: true,
      calories: undefined,
    });
    setShowAddMealModal(true);
  };

  const loadMealsForWeek = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(`${API_BASE_URL}/meals`);
      const data = await response.json();

      // Verifica se data.meals é um array
      if (!data.meals || !Array.isArray(data.meals)) {
        console.error('Formato de dados inválido recebido da API:', data);
        setMeals([]);
        setWeeklyMeals([]);
        setLoading(false);
        return;
      }

      // Mapeia as refeições para garantir que onDiet esteja definido corretamente
      const mappedMeals = data.meals.map((meal: any) => ({
        ...meal,
        onDiet: meal.onDiet || meal.on_diet === 1,
      }));

      setMeals(mappedMeals);

      // Organiza as refeições por semana
      const today = new Date();
      const startOfCurrentWeek = startOfWeek(
        addWeeks(today, currentWeekOffset),
        {weekStartsOn: 0},
      );
      const endOfWeek = addDays(startOfCurrentWeek, 6);

      const daysOfWeek = [...Array(7)].map((_, i) => {
        const date = addDays(startOfCurrentWeek, i);
        const formattedDate = format(date, 'yyyy-MM-dd');

        // Filtra as refeições para este dia - converte a data da API para o formato correto
        const mealsForDay = mappedMeals.filter((meal: any) => {
          // Verifica se o objeto meal e sua propriedade date existem
          if (!meal || !meal.date) return false;
          try {
            // A data da API vem no formato "2025-04-08T00:00:00.000Z"
            // Precisamos converter para "2025-04-08" para comparação
            const mealDate = meal.date.split('T')[0];
            return mealDate === formattedDate;
          } catch (error) {
            console.error('Erro ao processar data da refeição:', error, meal);
            return false;
          }
        });

        return {
          date,
          formattedDate,
          meals: mealsForDay.sort((a: any, b: any) => {
            // Verifica se as propriedades time existem antes de usar localeCompare
            if (!a.time || !b.time) return 0;
            return a.time.localeCompare(b.time);
          }),
        };
      });

      setWeeklyMeals(daysOfWeek);
    } catch (error) {
      console.error('Erro ao carregar refeições:', error);
      alert(
        'Erro ao carregar refeições. Não foi possível carregar suas refeições. Tente novamente mais tarde.',
      );
    } finally {
      setLoading(false);
    }
  }, [currentWeekOffset]);

  // Carrega as refeições ao montar o componente e quando mudar a semana
  useEffect(() => {
    loadMealsForWeek();
  }, [loadMealsForWeek]);

  // Adicionar a função helper para verificar se a data é futura
  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-star-dust-950 flex items-center justify-center">
        <div className="text-star-dust-50 text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-star-dust-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-star-dust-50">Daily Diet</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              Deletar Conta
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-star-dust-600 text-white rounded-md hover:bg-star-dust-700 focus:outline-none focus:ring-2 focus:ring-star-dust-500"
              data-test="logout-button">
              Sair
            </button>
          </div>
        </div>

        <div className="bg-star-dust-900 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-star-dust-700 flex items-center justify-center">
                <span className="text-2xl text-star-dust-300">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-star-dust-50">
                Olá, {user.firstName}! 👋
              </h2>
              <p className="text-star-dust-400">Que bom ter você por aqui!</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xl text-star-dust-300">
              Vamos começar a cuidar da sua alimentação?
            </p>
            <p className="text-star-dust-400">
              Aqui você pode registrar suas refeições diárias, acompanhar sua
              dieta e manter um estilo de vida saudável.
            </p>
          </div>
        </div>

        <div className="bg-star-dust-900 rounded-lg p-4 shadow-lg mb-6">
          <div className="flex p-1 bg-star-dust-850 rounded-lg shadow-sm">
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'grid'
                  ? 'bg-star-dust-800 text-white'
                  : 'text-star-dust-300 hover:bg-star-dust-800/50 hover:text-white'
              }`}
              onClick={() => setActiveTab('grid')}
              data-test="tab-grid">
              Grid
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'list'
                  ? 'bg-star-dust-800 text-white'
                  : 'text-star-dust-300 hover:bg-star-dust-800/50 hover:text-white'
              }`}
              onClick={() => setActiveTab('list')}
              data-test="tab-list">
              Lista
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'calendar'
                  ? 'bg-star-dust-800 text-white'
                  : 'text-star-dust-300 hover:bg-star-dust-800/50 hover:text-white'
              }`}
              onClick={() => setActiveTab('calendar')}
              data-test="tab-calendar">
              Calendário
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-star-dust-800 text-white'
                  : 'text-star-dust-300 hover:bg-star-dust-800/50 hover:text-white'
              }`}
              onClick={() => setActiveTab('dashboard')}
              data-test="tab-dashboard">
              Dashboard
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'grid' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium text-star-dust-300">
                      Suas Refeições da Semana
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                        className="p-1 text-star-dust-400 hover:text-star-dust-300 transition-colors"
                        title="Semana anterior">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentWeekOffset(0)}
                        className="px-2 py-1 text-sm text-star-dust-400 hover:text-star-dust-300 bg-star-dust-800/70 rounded transition-colors"
                        title="Voltar para semana atual">
                        Hoje
                      </button>
                      <button
                        onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                        className={`p-1 transition-colors ${
                          currentWeekOffset >= 0
                            ? 'text-star-dust-700 cursor-not-allowed'
                            : 'text-star-dust-400 hover:text-star-dust-300'
                        }`}
                        title="Próxima semana"
                        disabled={currentWeekOffset >= 0}>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <span className="text-sm text-star-dust-400 ml-2">
                        {format(
                          startOfWeek(addWeeks(new Date(), currentWeekOffset), {
                            weekStartsOn: 0,
                          }),
                          'dd/MM',
                          {locale: ptBR},
                        )}
                        {' - '}
                        {format(
                          addDays(
                            startOfWeek(
                              addWeeks(new Date(), currentWeekOffset),
                              {weekStartsOn: 0},
                            ),
                            6,
                          ),
                          'dd/MM',
                          {locale: ptBR},
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadMealsForWeek()}
                      className="text-sm text-star-dust-400 hover:text-star-dust-300"
                      data-test="refresh-meals">
                      Atualizar
                    </button>
                    <button
                      onClick={() => {
                        const testMeals = generateWeeklyMeals();
                        setMeals(testMeals);

                        // Organize meals by week
                        const today = new Date();
                        const startOfCurrentWeek = startOfWeek(
                          addWeeks(today, currentWeekOffset),
                          {weekStartsOn: 0},
                        );
                        const endOfWeek = addDays(startOfCurrentWeek, 6);

                        const daysOfWeek = [...Array(7)].map((_, i) => {
                          const date = addDays(startOfCurrentWeek, i);
                          const formattedDate = format(date, 'yyyy-MM-dd');

                          // Filtra as refeições para este dia usando a mesma lógica do loadMealsForWeek
                          const mealsForDay = testMeals.filter((meal) => {
                            return meal.date === formattedDate;
                          });

                          return {
                            date,
                            formattedDate,
                            meals: mealsForDay.sort((a, b) =>
                              a.time.localeCompare(b.time),
                            ),
                          };
                        });

                        setWeeklyMeals(daysOfWeek);
                      }}
                      className="text-sm text-star-dust-400 hover:text-star-dust-300 bg-star-dust-800 px-3 py-1 rounded transition-colors"
                      data-test="generate-test-data">
                      Gerar Dados de Teste
                    </button>
                  </div>
                </div>
                <div
                  className="grid grid-cols-7 gap-10 px-1"
                  data-test="week-days-grid">
                  {weeklyMeals.map((day, index) => {
                    const date = day.date;
                    const formattedDayDate = format(date, 'yyyy-MM-dd');
                    const isToday = isSameDay(date, new Date());

                    return (
                      <div
                        key={index}
                        className={`bg-star-dust-800 p-4 rounded-lg min-h-[280px] flex flex-col w-[calc(100%+20%)] -mx-4 ${
                          isToday ? 'border-2 border-star-dust-400' : ''
                        }`}
                        data-test="week-day-container">
                        <div className="text-center text-star-dust-300 mb-4 pb-2 border-b border-star-dust-700">
                          <span className="text-lg font-medium">
                            {format(date, 'EEE', {locale: ptBR})}
                          </span>
                          <br />
                          <span className="text-sm">
                            {format(date, 'dd/MM')}
                          </span>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-400px)] pr-1">
                          {day.meals.length > 0 ? (
                            day.meals.map((meal) => (
                              <div
                                key={meal.id}
                                className={`p-0 rounded overflow-hidden ${
                                  meal.onDiet || meal.on_diet === 1
                                    ? 'bg-green-900/30'
                                    : 'bg-red-900/30'
                                } hover:bg-opacity-50 transition-colors group relative flex flex-col`}>
                                <div
                                  className={`text-xs font-medium flex items-center justify-center w-full py-1 text-[10px] uppercase tracking-wide ${
                                    meal.onDiet || meal.on_diet === 1
                                      ? 'bg-green-900/40 text-green-400'
                                      : 'bg-amber-900/40 text-amber-400'
                                  }`}>
                                  {meal.onDiet || meal.on_diet === 1 ? (
                                    <svg
                                      className="w-3 h-3 mr-0.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-3 h-3 mr-0.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                      />
                                    </svg>
                                  )}
                                  <span>
                                    {meal.onDiet || meal.on_diet === 1
                                      ? 'Ok'
                                      : 'Livre'}
                                  </span>
                                </div>

                                <div className="flex-1 p-3">
                                  <div className="text-sm text-star-dust-200 font-medium leading-snug line-clamp-2 mb-2">
                                    {meal.name}
                                  </div>
                                  <div className="text-xs text-star-dust-400 line-clamp-2 mb-2">
                                    {meal.description}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-star-dust-400">
                                    <div className="flex items-center gap-1">
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      {meal.time}
                                    </div>
                                    {meal.calories && (
                                      <div className="flex items-center gap-1">
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                          />
                                        </svg>
                                        {meal.calories} kcal
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="px-3 pb-3 pt-2 border-t border-star-dust-700/30 w-full opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditMeal(meal)}
                                    className="p-1 text-star-dust-400 hover:text-star-dust-200 transition-colors"
                                    title="Editar refeição"
                                    data-test="edit-meal-button">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMeal(meal)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    title="Excluir refeição"
                                    data-test="delete-meal-button">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              {!isFutureDate(date) && (
                                <button
                                  onClick={() => handleOpenAddMealModal(date)}
                                  className="w-full h-full min-h-[100px] flex items-center justify-center text-star-dust-500 hover:text-star-dust-400 rounded transition-colors"
                                  data-test="add-meal-empty-day">
                                  <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {day.meals.length > 0 && !isFutureDate(date) && (
                          <button
                            onClick={() => handleOpenAddMealModal(date)}
                            className="mt-3 w-full py-2 text-sm text-star-dust-400 hover:text-star-dust-300 rounded transition-colors flex items-center justify-center gap-1"
                            data-test="add-meal-button">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Adicionar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-star-dust-300">
                    Todas as Refeições
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadMealsForWeek()}
                      className="text-sm text-star-dust-400 hover:text-star-dust-300"
                      data-test="refresh-meals">
                      Atualizar
                    </button>
                  </div>
                </div>

                {meals.length === 0 ? (
                  <div className="bg-star-dust-800 p-6 rounded-lg text-center">
                    <p className="text-star-dust-400">
                      Nenhuma refeição registrada ainda.
                    </p>
                    <button
                      onClick={() => handleOpenAddMealModal(new Date())}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      data-test="register-first-meal-button">
                      Registrar primeira refeição
                    </button>
                  </div>
                ) : (
                  <div className="bg-star-dust-800 rounded-lg divide-y divide-star-dust-700 overflow-hidden">
                    {/* Agrupar refeições por data */}
                    {Object.entries(
                      meals.reduce((acc: Record<string, Meal[]>, meal) => {
                        const dateKey = meal.date.split('T')[0];
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(meal);
                        return acc;
                      }, {}),
                    )
                      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                      .map(([date, mealsForDate]) => (
                        <div key={date} className="p-0">
                          <div className="bg-star-dust-850 p-3 sticky top-0">
                            <div className="text-sm font-medium text-star-dust-300">
                              {format(parseISO(date), 'dd/MM/yyyy')} (
                              {format(parseISO(date), 'EEEE', {locale: ptBR})})
                            </div>
                          </div>
                          <div className="divide-y divide-star-dust-700/50">
                            {mealsForDate
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map((meal) => (
                                <div
                                  key={meal.id}
                                  className="p-0 hover:bg-star-dust-750 transition-colors group">
                                  <div
                                    className={`text-xs font-medium flex items-center justify-center w-full py-1 text-[10px] uppercase tracking-wide ${
                                      meal.onDiet
                                        ? 'bg-green-900/40 text-green-400'
                                        : 'bg-amber-900/40 text-amber-400'
                                    }`}>
                                    {meal.onDiet ? (
                                      <svg
                                        className="w-3 h-3 mr-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-3 h-3 mr-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                      </svg>
                                    )}
                                    <span>{meal.onDiet ? 'Ok' : 'Livre'}</span>
                                  </div>

                                  <div className="flex-1 p-4">
                                    <div className="text-star-dust-200 font-medium mb-1">
                                      {meal.name}
                                    </div>
                                    <p className="text-star-dust-400 text-sm mb-3">
                                      {meal.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-star-dust-400">
                                      <div className="flex items-center gap-1">
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        {meal.time}
                                      </div>
                                      {meal.calories && (
                                        <div className="flex items-center gap-1">
                                          <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                          </svg>
                                          {meal.calories} kcal
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="px-4 pb-3 pt-2 border-t border-star-dust-700/30 w-full opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditMeal(meal)}
                                      className="p-1 text-star-dust-400 hover:text-star-dust-200 transition-colors"
                                      title="Editar refeição"
                                      data-test="edit-meal-button">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeal(meal)}
                                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                      title="Excluir refeição"
                                      data-test="delete-meal-button">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-star-dust-300">
                    Calendário de Refeições
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                      className="p-1 text-star-dust-400 hover:text-star-dust-300 transition-colors"
                      title="Mês anterior">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentWeekOffset(0)}
                      className="px-2 py-1 text-sm text-star-dust-400 hover:text-star-dust-300 bg-star-dust-800/70 rounded transition-colors"
                      title="Voltar para mês atual">
                      Hoje
                    </button>
                    <button
                      onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                      className={`p-1 transition-colors ${
                        currentWeekOffset >= 0
                          ? 'text-star-dust-700 cursor-not-allowed'
                          : 'text-star-dust-400 hover:text-star-dust-300'
                      }`}
                      title="Próximo mês"
                      disabled={currentWeekOffset >= 0}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <span className="text-sm text-star-dust-400 ml-2">
                      {format(
                        addWeeks(new Date(), currentWeekOffset * 4),
                        'MMMM yyyy',
                        {locale: ptBR},
                      )}
                    </span>
                  </div>
                </div>

                <div className="bg-star-dust-800 rounded-lg p-4">
                  {/* Cabeçalho com dias da semana */}
                  <div className="grid grid-cols-7 mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(
                      (day, index) => (
                        <div
                          key={index}
                          className="text-center text-star-dust-400 text-xs font-medium py-2">
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Calendário */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      // Calcular as datas para o mês atual
                      const today = new Date();
                      const currentMonth = addWeeks(
                        today,
                        currentWeekOffset * 4,
                      );
                      const firstDayOfMonth = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        1,
                      );
                      const lastDayOfMonth = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        0,
                      );

                      // Ajustar para começar do domingo da semana que contém o primeiro dia do mês
                      const startDate = startOfWeek(firstDayOfMonth, {
                        weekStartsOn: 0,
                      });

                      // Calcular o número de dias necessários para mostrar o mês completo
                      // (até o fim do mês + preencher a última semana)
                      const daysNeeded =
                        Math.ceil(
                          (lastDayOfMonth.getDate() +
                            firstDayOfMonth.getDay()) /
                            7,
                        ) * 7;

                      return Array.from({length: daysNeeded}).map(
                        (_, index) => {
                          const date = addDays(startDate, index);
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const isCurrentMonth =
                            date.getMonth() === currentMonth.getMonth();
                          const isToday = isSameDay(date, today);

                          // Filtrar refeições para esta data
                          const mealsForDay = meals.filter((meal) => {
                            try {
                              const mealDate = meal.date.split('T')[0];
                              return mealDate === dateStr;
                            } catch (error) {
                              return false;
                            }
                          });

                          // Contar refeições na dieta e fora da dieta
                          const onDietCount = mealsForDay.filter(
                            (meal) => meal.onDiet,
                          ).length;
                          const offDietCount = mealsForDay.filter(
                            (meal) => !meal.onDiet,
                          ).length;

                          return (
                            <div
                              key={index}
                              className={`aspect-square p-2 rounded-lg flex flex-col ${
                                isToday
                                  ? 'bg-blue-900/30 border border-blue-500/50'
                                  : isCurrentMonth
                                  ? 'bg-star-dust-750'
                                  : 'bg-star-dust-850/50'
                              } ${
                                !isFutureDate(date) && isCurrentMonth
                                  ? 'cursor-pointer hover:bg-star-dust-700'
                                  : ''
                              }`}
                              onClick={() => {
                                if (!isFutureDate(date) && isCurrentMonth) {
                                  handleOpenAddMealModal(date);
                                }
                              }}>
                              <div
                                className={`text-center text-sm ${
                                  isToday
                                    ? 'text-blue-300 font-bold'
                                    : isCurrentMonth
                                    ? 'text-star-dust-300'
                                    : 'text-star-dust-600'
                                }`}>
                                {format(date, 'd')}
                              </div>

                              {(onDietCount > 0 || offDietCount > 0) && (
                                <div className="mt-auto mb-1 flex flex-col gap-1 items-center">
                                  {onDietCount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs bg-green-900/30 text-green-400 px-1 rounded-sm flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-0.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        {onDietCount}
                                      </span>
                                    </div>
                                  )}
                                  {offDietCount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs bg-amber-900/30 text-amber-400 px-1 rounded-sm flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-0.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                          />
                                        </svg>
                                        {offDietCount}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      );
                    })()}
                  </div>

                  <div className="flex justify-center gap-6 mt-4 text-xs text-star-dust-400">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded-sm font-medium flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Adequado
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded-sm font-medium flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Livre
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Hoje</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab meals={meals} loadMealsForWeek={loadMealsForWeek} />
            )}
          </div>
        </div>
      </div>

      {/* Modal de adicionar/editar refeição */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-star-dust-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-star-dust-100 mb-4">
              {selectedMeal ? 'Editar Refeição' : 'Adicionar Refeição'}
            </h2>
            <p className="text-sm text-star-dust-300 mb-4">
              Data: {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
              {selectedDate &&
                `(${format(selectedDate, 'EEEE', {locale: ptBR})})`}
            </p>
            <form
              onSubmit={selectedMeal ? handleUpdateMeal : handleAddMeal}
              className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-star-dust-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={newMeal.name}
                  onChange={(e) =>
                    setNewMeal((prev) => ({...prev, name: e.target.value}))
                  }
                  className="w-full px-3 py-2 bg-star-dust-700 text-star-dust-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  data-test="meal-name-input"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-star-dust-300 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={newMeal.description}
                  onChange={(e) =>
                    setNewMeal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-star-dust-700 text-star-dust-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                  data-test="meal-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-star-dust-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={newMeal.date}
                    onChange={(e) => {
                      // Atualiza o state com a nova data
                      setNewMeal((prev) => ({...prev, date: e.target.value}));
                      // Atualiza o selectedDate para refletir no header
                      if (e.target.value) {
                        try {
                          // Usar parseISO para converter a string de data para objeto Date
                          const newDate = parseISO(e.target.value);
                          setSelectedDate(newDate);
                        } catch (error) {
                          console.error('Erro ao converter data:', error);
                          // Fallback para o construtor nativo se parseISO falhar
                          setSelectedDate(new Date(e.target.value));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-star-dust-700 text-star-dust-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    max={format(new Date(), 'yyyy-MM-dd')}
                    required
                    data-test="meal-date-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-star-dust-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={newMeal.time}
                    onChange={(e) =>
                      setNewMeal((prev) => ({...prev, time: e.target.value}))
                    }
                    className="w-full px-3 py-2 bg-star-dust-700 text-star-dust-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    data-test="meal-time-input"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="calories"
                  className="block text-sm font-medium text-star-dust-300 mb-1">
                  Calorias
                </label>
                <input
                  type="number"
                  id="calories"
                  value={newMeal.calories || ''}
                  onChange={(e) =>
                    setNewMeal((prev) => ({
                      ...prev,
                      calories: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-star-dust-700 text-star-dust-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-test="meal-calories-input"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onDiet"
                  checked={newMeal.onDiet}
                  onChange={(e) =>
                    setNewMeal((prev) => ({...prev, onDiet: e.target.checked}))
                  }
                  className="w-4 h-4 text-blue-600 bg-star-dust-700 border-star-dust-600 rounded focus:ring-blue-500"
                  data-test="meal-on-diet-input"
                />
                <label
                  htmlFor="onDiet"
                  className="ml-2 text-sm font-medium text-star-dust-300">
                  Está dentro da dieta?
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMeal) {
                      setSelectedMeal(null);
                    }
                    setShowAddMealModal(false);
                  }}
                  className="px-4 py-2 text-star-dust-400 hover:text-star-dust-300 rounded-md transition-colors"
                  data-test="meal-modal-cancel">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-test={
                    selectedMeal ? 'update-meal-button' : 'add-meal-button'
                  }>
                  {selectedMeal ? 'Atualizar' : 'Adicionar'} Refeição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modification History - Discreto */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowModificationHistory((prev) => !prev)}
          className="bg-star-dust-800/70 text-star-dust-400 hover:text-star-dust-300 p-2 rounded-full shadow-lg hover:bg-star-dust-700 transition-colors"
          title="Histórico de Modificações">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {showModificationHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-star-dust-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-star-dust-50">
                Histórico de Modificações
              </h3>
              <button
                onClick={() => setShowModificationHistory(false)}
                className="text-star-dust-400 hover:text-star-dust-300">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {modificationHistory.map((modification) => (
                <div
                  key={modification.id}
                  className="bg-star-dust-800 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-star-dust-300">
                      {modification.type === 'create' && '➕ Criada'}
                      {modification.type === 'update' && '✏️ Atualizada'}
                      {modification.type === 'delete' && '🗑️ Deletada'}
                    </span>
                    <span className="text-star-dust-400 ml-2">
                      {modification.meal.name} -{' '}
                      {format(new Date(modification.meal.date), 'dd/MM/yyyy')}{' '}
                      {modification.meal.time}
                    </span>
                  </div>
                  <span className="text-star-dust-400 text-sm">
                    {format(modification.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-star-dust-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-star-dust-50 mb-4">
              Tem certeza que deseja deletar sua conta?
            </h3>
            <p className="text-star-dust-400 mb-6">
              Esta ação não pode ser desfeita. Todos os seus dados serão
              permanentemente removidos.
            </p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-star-dust-700 text-white rounded-md hover:bg-star-dust-600 focus:outline-none focus:ring-2 focus:ring-star-dust-500"
                disabled={isDeleting}>
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleting}
                data-test="confirm-delete-button">
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
