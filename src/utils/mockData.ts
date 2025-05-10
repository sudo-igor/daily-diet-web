import { addDays, format, startOfWeek } from 'date-fns';

interface Meal {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  onDiet: boolean;
  calories?: number;
}

interface MealOption {
  name: string;
  calories: number;
  onDiet: boolean;
}

interface MealType {
  type: string;
  times: string[];
  options: MealOption[];
}

const mealTypes: MealType[] = [
  {
    type: 'Café da Manhã',
    times: ['06:30', '07:00', '07:30', '08:00', '08:30'],
    options: [
      { name: 'Pão integral com ovo', calories: 250, onDiet: true },
      { name: 'Tapioca com queijo', calories: 200, onDiet: true },
      { name: 'Vitamina de banana', calories: 180, onDiet: true },
      { name: 'Iogurte com granola', calories: 220, onDiet: true },
      { name: 'Panquecas com mel', calories: 300, onDiet: false }
    ]
  },
  {
    type: 'Lanche da Manhã',
    times: ['09:30', '10:00', '10:30'],
    options: [
      { name: 'Maçã com amendoim', calories: 150, onDiet: true },
      { name: 'Mix de castanhas', calories: 180, onDiet: true },
      { name: 'Barra de cereal', calories: 110, onDiet: true },
      { name: 'Banana com aveia', calories: 130, onDiet: true }
    ]
  },
  {
    type: 'Almoço',
    times: ['11:30', '12:00', '12:30', '13:00', '13:30'],
    options: [
      { name: 'Frango grelhado com salada', calories: 400, onDiet: true },
      { name: 'Peixe com legumes', calories: 350, onDiet: true },
      { name: 'Feijoada', calories: 800, onDiet: false },
      { name: 'Strogonoff com arroz', calories: 700, onDiet: false },
      { name: 'Salada Caesar', calories: 300, onDiet: true }
    ]
  },
  {
    type: 'Lanche da Tarde',
    times: ['15:00', '15:30', '16:00', '16:30'],
    options: [
      { name: 'Smoothie de frutas', calories: 180, onDiet: true },
      { name: 'Pão de queijo', calories: 250, onDiet: false },
      { name: 'Café com biscoito', calories: 200, onDiet: false },
      { name: 'Iogurte com frutas', calories: 150, onDiet: true }
    ]
  },
  {
    type: 'Jantar',
    times: ['18:30', '19:00', '19:30', '20:00', '20:30'],
    options: [
      { name: 'Sopa de legumes', calories: 250, onDiet: true },
      { name: 'Omelete com salada', calories: 300, onDiet: true },
      { name: 'Pizza', calories: 800, onDiet: false },
      { name: 'Hambúrguer caseiro', calories: 600, onDiet: false },
      { name: 'Salada com atum', calories: 280, onDiet: true }
    ]
  }
];

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateWeeklyMeals(): Meal[] {
  const generatedMeals: Meal[] = [];
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

  // Generate meals for the current week
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startOfCurrentWeek, i);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    // Generate between 3 and 5 meals per day
    const numberOfMeals = Math.floor(Math.random() * 3) + 3;
    const usedMealTypes = new Set<string>();

    // Ensure main meals (breakfast, lunch, dinner)
    const requiredMeals = [
      mealTypes[0], // Breakfast
      mealTypes[2], // Lunch
      mealTypes[4], // Dinner
    ];

    // Add main meals first
    for (const mealType of requiredMeals) {
      const option = pickRandom(mealType.options);
      const time = pickRandom(mealType.times);

      generatedMeals.push({
        id: crypto.randomUUID(),
        name: option.name,
        description: `${mealType.type} - ${option.name}`,
        date: formattedDate,
        time: time,
        onDiet: option.onDiet,
        calories: option.calories
      });

      usedMealTypes.add(mealType.type);
    }

    // Add extra meals (snacks) if needed
    const extraMeals = numberOfMeals - 3;
    if (extraMeals > 0) {
      for (let i = 0; i < extraMeals; i++) {
        let mealType: MealType;
        do {
          mealType = pickRandom(mealTypes);
        } while (usedMealTypes.has(mealType.type));

        usedMealTypes.add(mealType.type);

        const option = pickRandom(mealType.options);
        const time = pickRandom(mealType.times);

        generatedMeals.push({
          id: crypto.randomUUID(),
          name: option.name,
          description: `${mealType.type} - ${option.name}`,
          date: formattedDate,
          time: time,
          onDiet: option.onDiet,
          calories: option.calories
        });
      }
    }
  }

  // Sort by date and time
  return generatedMeals.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });
}
