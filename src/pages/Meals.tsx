import React from 'react';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';

interface Meal {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  onDiet: boolean;
  calories?: number;
}

interface MealsProps {
  meals: Meal[];
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: string) => void;
}

export default function Meals({meals, onEditMeal, onDeleteMeal}: MealsProps) {
  const sortedMeals = [...meals].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", {locale: ptBR});
  };

  return (
    <div className="space-y-4">
      {sortedMeals.map((meal) => (
        <div
          key={meal.id}
          className="bg-star-dust-800 p-4 rounded-lg"
          data-test="meal-item">
          <div className="flex justify-between items-start">
            <div>
              <h3
                className="text-lg font-medium text-star-dust-50"
                data-test="meal-name">
                {meal.name}
              </h3>
              <p
                className="text-star-dust-400 text-sm mt-1"
                data-test="meal-date">
                {formatDate(meal.date)}
              </p>
              <p className="text-star-dust-400 text-sm" data-test="meal-time">
                {meal.time}
              </p>
              {meal.description && (
                <p
                  className="text-star-dust-300 mt-2"
                  data-test="meal-description">
                  {meal.description}
                </p>
              )}
              {meal.calories && (
                <p
                  className="text-star-dust-400 text-sm mt-1"
                  data-test="meal-calories">
                  {meal.calories} kcal
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditMeal(meal)}
                className="text-sm text-star-dust-400 hover:text-star-dust-300"
                data-test="meal-edit-button">
                Editar
              </button>
              <button
                onClick={() => onDeleteMeal(meal.id)}
                className="text-sm text-red-400 hover:text-red-300"
                data-test="meal-delete-button">
                Excluir
              </button>
            </div>
          </div>
          <div
            className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs ${
              meal.onDiet
                ? 'bg-green-900 text-green-300'
                : 'bg-amber-900 text-amber-300'
            }`}
            data-test="meal-diet-status">
            {meal.onDiet ? 'Na Dieta' : 'Fora da Dieta'}
          </div>
        </div>
      ))}
    </div>
  );
}
