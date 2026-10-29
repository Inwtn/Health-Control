import type {
  Food,
  FoodEntry,
  NutrientKey,
  Profile,
  Training,
} from "./types.ts";

export const activityLevels = {
  sedentary: {
    label: "Pouco ativo",
    detail: "Rotina sentada, sem exercício regular",
    factor: 1.2,
  },
  light: {
    label: "Levemente ativo",
    detail: "Atividade leve, 1 a 3 vezes/semana",
    factor: 1.375,
  },
  moderate: {
    label: "Moderadamente ativo",
    detail: "Atividade moderada, 3 a 5 vezes/semana",
    factor: 1.55,
  },
  high: {
    label: "Muito ativo",
    detail: "Atividade intensa, 6 a 7 vezes/semana",
    factor: 1.725,
  },
};
export const goalNames = {
  lose: "Reduzir peso",
  maintain: "Manter o equilíbrio",
  gain: "Ganhar massa",
};
export const meals = ["Café da manhã", "Almoço", "Lanche", "Jantar"] as const;
export const nutrients: {
  key: NutrientKey;
  label: string;
  unit: string;
  group: "macro" | "micro" | "other";
}[] = [
  { key: "kcal", label: "Energia", unit: "kcal", group: "macro" },
  { key: "protein", label: "Proteínas", unit: "g", group: "macro" },
  { key: "carbohydrates", label: "Carboidratos", unit: "g", group: "macro" },
  { key: "lipids", label: "Gorduras", unit: "g", group: "macro" },
  { key: "dietaryFiber", label: "Fibras", unit: "g", group: "other" },
  { key: "cholesterol", label: "Colesterol", unit: "mg", group: "other" },
  { key: "calcium", label: "Cálcio", unit: "mg", group: "micro" },
  { key: "iron", label: "Ferro", unit: "mg", group: "micro" },
  { key: "magnesium", label: "Magnésio", unit: "mg", group: "micro" },
  { key: "phosphorus", label: "Fósforo", unit: "mg", group: "micro" },
  { key: "potassium", label: "Potássio", unit: "mg", group: "micro" },
  { key: "sodium", label: "Sódio", unit: "mg", group: "micro" },
  { key: "zinc", label: "Zinco", unit: "mg", group: "micro" },
  { key: "copper", label: "Cobre", unit: "mg", group: "micro" },
  { key: "manganese", label: "Manganês", unit: "mg", group: "micro" },
  { key: "retinol", label: "Retinol", unit: "µg", group: "micro" },
  { key: "re", label: "Vitamina A (RE)", unit: "µg", group: "micro" },
  { key: "rae", label: "Vitamina A (RAE)", unit: "µg", group: "micro" },
  { key: "thiamin", label: "Vitamina B1", unit: "mg", group: "micro" },
  { key: "riboflavin", label: "Vitamina B2", unit: "mg", group: "micro" },
  { key: "pyridoxine", label: "Vitamina B6", unit: "mg", group: "micro" },
  { key: "niacin", label: "Vitamina B3", unit: "mg", group: "micro" },
  { key: "vitaminC", label: "Vitamina C", unit: "mg", group: "micro" },
];
export function validateProfile(p: Profile): string | null {
  if (!p.name.trim() || p.name.length > 60)
    return "Informe um nome com até 60 caracteres.";
  if (
    !Number.isFinite(p.age) ||
    !Number.isInteger(p.age) ||
    p.age < 14 ||
    p.age > 100
  )
    return "Informe uma idade entre 14 e 100 anos.";
  if (!Number.isFinite(p.weight) || p.weight < 30 || p.weight > 350)
    return "Informe um peso entre 30 e 350 kg.";
  if (!Number.isFinite(p.height) || p.height < 120 || p.height > 230)
    return "Informe uma altura entre 120 e 230 cm.";
  if (
    !Number.isInteger(p.weeklyActivity) ||
    p.weeklyActivity < 0 ||
    p.weeklyActivity > 7
  )
    return "Informe a frequência de atividade entre 0 e 7 vezes na semana.";
  if (
    !(p.activity in activityLevels) ||
    !["male", "female"].includes(p.sex) ||
    !(p.goal in goalNames) ||
    !["all", "vegetarian", "vegan"].includes(p.diet)
  )
    return "Revise as opções do perfil.";
  if (
    p.targetWeight !== null &&
    (!Number.isFinite(p.targetWeight) ||
      p.targetWeight < 30 ||
      p.targetWeight > 350)
  )
    return "Informe um peso desejado entre 30 e 350 kg.";
  if (
    p.targetWeight !== null &&
    p.goal === "lose" &&
    p.targetWeight >= p.weight
  )
    return "Para reduzir peso, o peso desejado deve ser menor que o atual.";
  if (
    p.targetWeight !== null &&
    p.goal === "gain" &&
    p.targetWeight <= p.weight
  )
    return "Para ganhar massa, o peso desejado deve ser maior que o atual.";
  if (p.targetWeight !== null && p.targetWeight / (p.height / 100) ** 2 < 18.5)
    return "Esse peso desejado está abaixo da faixa de referência para adultos. Defina o objetivo com um profissional.";
  return null;
}
export function calculatePlan(p: Profile) {
  if (validateProfile(p)) throw new Error("Perfil inválido");
  const basal =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const expenditure = basal * activityLevels[p.activity].factor;
  const bmi = p.weight / (p.height / 100) ** 2;
  const supervised =
    p.age < 18 || p.needsSupervision || bmi < 18.5 || bmi >= 40;
  if (supervised)
    return {
      basal,
      expenditure,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      supervised: true,
    };
  const factor = p.goal === "lose" ? 0.85 : p.goal === "gain" ? 1.1 : 1;
  const calories = Math.round(
    Math.max(expenditure * factor, p.sex === "male" ? 1500 : 1200),
  );
  const protein = Math.round(
    Math.min(
      p.weight * (p.goal === "maintain" ? 1.4 : 1.6),
      (calories * 0.35) / 4,
    ),
  );
  const fat = Math.round((calories * 0.3) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return {
    basal,
    expenditure,
    calories,
    protein,
    carbs,
    fat,
    supervised: false,
  };
}
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function searchFoods(foods: Food[], query: string, category = "") {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return foods.filter(
    (f) =>
      (!category || f.category === category) &&
      terms.every((term) => normalize(f.name).includes(term)),
  );
}
export function totalNutrient(
  entries: FoodEntry[],
  foods: Food[],
  key: NutrientKey,
) {
  let value = 0;
  let known = 0;
  for (const entry of entries) {
    const amount = foods.find((f) => f.id === entry.foodId)?.nutrients[key];
    if (amount !== null && amount !== undefined) {
      value += (amount * entry.grams) / 100;
      known++;
    }
  }
  return {
    value,
    known,
    total: entries.length,
    complete: known === entries.length,
  };
}
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftDate(key: string, amount: number) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  note: string;
};
export type Workout = { name: string; focus: string; exercises: Exercise[] };
export function generateWorkouts(t: Training): Workout[] {
  if (t.limitation) return [];
  const sets = t.experience === "beginner" ? 2 : 3;
  const reps = t.goal === "conditioning" ? "12–15" : "8–12";
  const rest = t.goal === "conditioning" ? "60–90 s" : "90–120 s";
  const ex = (
    name: string,
    note = "Carga confortável; termine com 2–3 repetições de reserva.",
  ): Exercise => ({
    name,
    sets: name === "Prancha" ? 2 : sets,
    reps: name === "Prancha" ? "15–30 s" : reps,
    rest,
    note,
  });
  const home = t.equipment === "home";
  const legs = home
    ? [
        ex("Agachamento com peso corporal"),
        ex("Ponte de glúteos"),
        ex("Afundo com apoio"),
      ]
    : [ex("Leg press"), ex("Mesa flexora"), ex("Elevação pélvica")];
  const upper = home
    ? [
        ex("Flexão na parede ou bancada"),
        ex(
          "Remada com elástico",
          "Requer elástico íntegro e ponto de apoio seguro.",
        ),
        ex("Prancha", "2 séries de 15–30 segundos, sem prender a respiração."),
      ]
    : [ex("Supino na máquina"), ex("Puxada frontal"), ex("Remada baixa")];
  const count = t.minutes === 30 ? 4 : t.minutes === 45 ? 5 : 6;
  const full = (reverse: boolean) =>
    (reverse
      ? [legs[1], upper[1], legs[0], upper[0], legs[2], upper[2]]
      : [legs[0], upper[0], upper[1], legs[1], upper[2], legs[2]]
    ).slice(0, count);
  if (t.days <= 3)
    return Array.from({ length: t.days }, (_, i) => ({
      name: `Treino ${String.fromCharCode(65 + i)}`,
      focus: "Corpo inteiro",
      exercises: full(i % 2 === 1),
    }));
  return Array.from({ length: t.days }, (_, i) => {
    const lower = i % 2 === 0;
    const extras = home
      ? [
          ex("Elevação de panturrilhas"),
          ex("Dead bug", "Movimento lento, mantendo a lombar confortável."),
          ex("Elevação lateral com elástico"),
        ]
      : [
          ex("Panturrilhas na máquina"),
          ex(
            "Prancha",
            "2 séries de 15–30 segundos, sem prender a respiração.",
          ),
          ex("Elevação lateral"),
        ];
    return {
      name: `Treino ${String.fromCharCode(65 + i)}`,
      focus: lower ? "Membros inferiores + core" : "Membros superiores + core",
      exercises: [...(lower ? legs : upper), ...extras].slice(0, count),
    };
  });
}
