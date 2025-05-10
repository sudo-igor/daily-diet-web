import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

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

interface DashboardTabProps {
  meals: Meal[];
  loadMealsForWeek: () => Promise<void>;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  meals,
  loadMealsForWeek,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-star-dust-300">
          Dashboard de Refeições
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => loadMealsForWeek()}
            className="text-sm text-star-dust-400 hover:text-star-dust-300"
            data-test="dashboard-refresh-button">
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Cartão de estatísticas gerais */}
        <div
          className="bg-star-dust-800 rounded-lg p-4"
          data-test="dashboard-summary-card">
          <h4 className="text-star-dust-300 font-medium mb-3">Resumo Geral</h4>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-star-dust-750 p-3 rounded-lg"
              data-test="dashboard-total-meals">
              <div className="text-star-dust-400 text-sm mb-1">
                Total de Refeições
              </div>
              <div className="text-2xl font-semibold text-star-dust-200">
                {meals.length}
              </div>
            </div>

            <div
              className="bg-star-dust-750 p-3 rounded-lg"
              data-test="dashboard-on-diet-meals">
              <div className="text-star-dust-400 text-sm mb-1">Na Dieta</div>
              <div className="text-2xl font-semibold text-green-400">
                {meals.filter((meal) => meal.onDiet).length}
                <span className="text-sm font-normal text-star-dust-400 ml-1">
                  (
                  {Math.round(
                    (meals.filter((meal) => meal.onDiet).length /
                      meals.length) *
                      100,
                  ) || 0}
                  %)
                </span>
              </div>
            </div>

            <div
              className="bg-star-dust-750 p-3 rounded-lg"
              data-test="dashboard-off-diet-meals">
              <div className="text-star-dust-400 text-sm mb-1">
                Fora da Dieta
              </div>
              <div className="text-2xl font-semibold text-amber-400">
                {meals.filter((meal) => !meal.onDiet).length}
                <span className="text-sm font-normal text-star-dust-400 ml-1">
                  (
                  {Math.round(
                    (meals.filter((meal) => !meal.onDiet).length /
                      meals.length) *
                      100,
                  ) || 0}
                  %)
                </span>
              </div>
            </div>

            <div
              className="bg-star-dust-750 p-3 rounded-lg"
              data-test="dashboard-avg-calories">
              <div className="text-star-dust-400 text-sm mb-1">
                Média de Calorias
              </div>
              <div className="text-2xl font-semibold text-blue-400">
                {Math.round(
                  meals.reduce((acc, meal) => acc + (meal.calories || 0), 0) /
                    meals.length,
                ) || 0}
                <span className="text-sm font-normal text-star-dust-400 ml-1">
                  kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de distribuição de dieta */}
        <div
          className="bg-star-dust-800 rounded-lg p-4"
          data-test="dashboard-diet-distribution">
          <h4 className="text-star-dust-300 font-medium mb-3">
            Distribuição da Dieta
          </h4>

          {meals.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Na Dieta',
                        value: meals.filter((meal) => meal.onDiet).length,
                      },
                      {
                        name: 'Fora da Dieta',
                        value: meals.filter((meal) => !meal.onDiet).length,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }>
                    <Cell fill="#4ade80" />
                    <Cell fill="#fbbf24" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#292524',
                      border: 'none',
                      borderRadius: '0.25rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-star-dust-400">
                Nenhuma refeição registrada ainda.
              </p>
            </div>
          )}
        </div>

        {/* Gráfico de refeições por dia da semana */}
        <div
          className="bg-star-dust-800 rounded-lg p-4"
          data-test="dashboard-weekday-chart">
          <h4 className="text-star-dust-300 font-medium mb-3">
            Refeições por Dia da Semana
          </h4>

          {meals.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(() => {
                    const daysOfWeek = [
                      'Domingo',
                      'Segunda',
                      'Terça',
                      'Quarta',
                      'Quinta',
                      'Sexta',
                      'Sábado',
                    ];
                    const dayCountMap = new Array(7).fill(0);

                    meals.forEach((meal) => {
                      try {
                        const dayOfWeek = new Date(meal.date).getDay();
                        dayCountMap[dayOfWeek]++;
                      } catch (error) {
                        // Ignorar datas inválidas
                      }
                    });

                    return daysOfWeek.map((day, index) => ({
                      name: day.substring(0, 3),
                      refeições: dayCountMap[index],
                    }));
                  })()}
                  margin={{top: 5, right: 30, left: 5, bottom: 5}}>
                  <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} />
                  <YAxis stroke="#a8a29e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#292524',
                      border: 'none',
                      borderRadius: '0.25rem',
                    }}
                    cursor={{fill: '#1c1917'}}
                  />
                  <Bar dataKey="refeições" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-star-dust-400">
                Nenhuma refeição registrada ainda.
              </p>
            </div>
          )}
        </div>

        {/* Gráfico de tendência de calorias */}
        <div
          className="bg-star-dust-800 rounded-lg p-4"
          data-test="dashboard-calories-trend">
          <h4 className="text-star-dust-300 font-medium mb-3">
            Tendência de Calorias (10 Últimas Refeições)
          </h4>

          {meals.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...meals]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                          new Date(a.date).getTime() ||
                        b.time.localeCompare(a.time),
                    )
                    .slice(0, 10)
                    .reverse()
                    .map((meal, index) => ({
                      name: `${index + 1}`,
                      calorias: meal.calories || 0,
                      dieta: meal.onDiet ? 'Sim' : 'Não',
                    }))}
                  margin={{top: 5, right: 30, left: 5, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                  <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} />
                  <YAxis stroke="#a8a29e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#292524',
                      border: 'none',
                      borderRadius: '0.25rem',
                    }}
                    formatter={(value, name) => [
                      value,
                      name === 'calorias' ? 'Calorias' : 'Na dieta',
                    ]}
                    labelFormatter={(value) => `Refeição ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="calorias"
                    stroke="#3b82f6"
                    activeDot={{r: 8}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-star-dust-400">
                Nenhuma refeição registrada ainda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
