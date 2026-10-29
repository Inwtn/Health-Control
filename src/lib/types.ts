export type Goal = "lose" | "maintain" | "gain";
export type Profile = {
  name: string;
  age: number;
  weight: number;
  height: number;
  sex: "female" | "male";
  activity: "sedentary" | "light" | "moderate" | "high";
  weeklyActivity: number;
  goal: Goal;
  diet: "all" | "vegetarian" | "vegan";
  targetWeight: number | null;
  needsSupervision: boolean;
};
export type Training = {
  days: number;
  experience: "beginner" | "intermediate";
  minutes: 30 | 45 | 60;
  equipment: "gym" | "home";
  goal: "strength" | "conditioning";
  limitation: boolean;
};
export type NutrientKey =
  | "kcal"
  | "protein"
  | "lipids"
  | "carbohydrates"
  | "dietaryFiber"
  | "cholesterol"
  | "calcium"
  | "magnesium"
  | "manganese"
  | "phosphorus"
  | "iron"
  | "sodium"
  | "potassium"
  | "copper"
  | "zinc"
  | "retinol"
  | "re"
  | "rae"
  | "thiamin"
  | "riboflavin"
  | "pyridoxine"
  | "niacin"
  | "vitaminC";
export type Food = {
  id: number;
  name: string;
  category: string;
  nutrients: Record<NutrientKey, number | null>;
};
export type MealName = "Café da manhã" | "Almoço" | "Lanche" | "Jantar";
export type FoodEntry = {
  id: string;
  date: string;
  meal: MealName;
  foodId: number;
  grams: number;
};
export type WaterEntry = { id: string; date: string; ml: number; time: string };
export type AppState = {
  version: 1;
  profile: Profile | null;
  training: Training | null;
  entries: FoodEntry[];
  water: WaterEntry[];
  waterGoal: number;
  completed: Record<string, boolean>;
};
