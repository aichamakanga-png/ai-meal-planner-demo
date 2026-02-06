
export type Goal = 'lose fat' | 'gain muscle' | 'save money';
export type Diet = 'omnivore' | 'vegetarian' | 'vegan';

export interface Meal {
  title: string;
  summary: string;
  calories?: number;
}

export interface DayPlan {
  day: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface ShoppingItem {
  item: string;
  category: string;
}

export interface MealPlanResponse {
  plan: DayPlan[];
  shoppingList: ShoppingItem[];
}

export interface UserInputs {
  goal: Goal;
  diet: Diet;
  allergies: string;
  timePerMeal: string;
  budget: string;
  existingIngredients: string;
  batchCooking: boolean;
}
