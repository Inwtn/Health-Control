import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  calculatePlan,
  dateKey,
  generateWorkouts,
  searchFoods,
  shiftDate,
  totalNutrient,
  validateProfile,
} from "./health.ts";
import type { Food, FoodEntry, Profile, Training } from "./types.ts";

const foods = JSON.parse(
  readFileSync(new URL("../data/foods.json", import.meta.url), "utf8"),
) as Food[];
const profile: Profile = {
  name: "Ana",
  age: 30,
  weight: 80,
  height: 180,
  sex: "male",
  activity: "moderate",
  weeklyActivity: 4,
  goal: "maintain",
  diet: "all",
  targetWeight: null,
  needsSupervision: false,
};
const training: Training = {
  days: 3,
  experience: "beginner",
  minutes: 45,
  equipment: "gym",
  goal: "strength",
  limitation: false,
};

test("Mifflin–St Jeor distingue basal, gasto com atividade e meta", () => {
  const result = calculatePlan(profile);
  assert.equal(result.basal, 1780);
  assert.equal(result.expenditure, 2759);
  assert.equal(result.calories, 2759);
  assert.equal(calculatePlan({ ...profile, sex: "female" }).basal, 1614);
  const sedentary = calculatePlan({
    ...profile,
    activity: "sedentary",
    weeklyActivity: 0,
  });
  assert.equal(sedentary.basal, result.basal);
  assert.equal(sedentary.expenditure, 2136);
});
test("déficit e acréscimo alteram o gasto somente na meta alimentar", () => {
  const loss = calculatePlan({ ...profile, goal: "lose", targetWeight: 75 });
  const gain = calculatePlan({ ...profile, goal: "gain", targetWeight: 85 });
  assert.equal(loss.calories, 2345);
  assert.equal(gain.calories, 3035);
  assert.equal(loss.basal, gain.basal);
  assert.ok(loss.protein && loss.fat && loss.carbs);
  assert.ok(
    Math.abs(
      loss.protein * 4 + loss.fat * 9 + loss.carbs * 4 - loss.calories!,
    ) <= 4,
  );
});
test("menores, supervisão e faixas inadequadas não recebem dieta automática", () => {
  for (const extra of [
    { age: 17 },
    { needsSupervision: true },
    { weight: 50 },
    { weight: 180 },
  ]) {
    const result = calculatePlan({ ...profile, ...extra });
    assert.equal(result.supervised, true);
    assert.equal(result.calories, null);
    assert.equal(result.protein, null);
  }
});
test("perfil rejeita entradas não finitas, frequência inválida e objetivos incompatíveis", () => {
  assert.equal(validateProfile(profile), null);
  for (const extra of [
    { weight: NaN },
    { height: Infinity },
    { weeklyActivity: 8 },
    { age: 30.5 },
    { name: "" },
    { goal: "lose" as const, targetWeight: 85 },
    { goal: "gain" as const, targetWeight: 75 },
    { goal: "lose" as const, targetWeight: 40 },
  ])
    assert.ok(validateProfile({ ...profile, ...extra }));
  assert.throws(() => calculatePlan({ ...profile, height: 0 }));
});
test("metas de macros continuam dentro da energia em pesos maiores", () => {
  const result = calculatePlan({
    ...profile,
    weight: 120,
    height: 200,
    age: 80,
    activity: "sedentary",
    goal: "lose",
  });
  assert.ok(result.calories && result.protein && result.carbs && result.fat);
  assert.ok(
    Math.abs(
      result.protein * 4 + result.carbs * 4 + result.fat * 9 - result.calories,
    ) <= 4,
  );
});
test("TACO mantém 597 identidades únicas e dados numéricos ou ausentes", () => {
  assert.equal(foods.length, 597);
  assert.equal(new Set(foods.map((f) => f.id)).size, 597);
  for (const food of foods) {
    assert.ok(food.name && food.category);
    for (const value of Object.values(food.nutrients))
      assert.ok(value === null || (Number.isFinite(value) && value >= 0));
  }
});
test("quantidade pesa os nutrientes e mantém precisão antes da exibição", () => {
  const entries: FoodEntry[] = [
    { id: "1", date: "2026-10-29", meal: "Almoço", foodId: 1, grams: 150 },
    { id: "2", date: "2026-10-29", meal: "Almoço", foodId: 410, grams: 120 },
  ];
  assert.equal(totalNutrient(entries, foods, "kcal").value, 376.8);
  assert.equal(totalNutrient(entries, foods, "kcal").complete, true);
  assert.ok(
    Math.abs(totalNutrient(entries, foods, "protein").value - 42.3) < 0.001,
  );
});
test("ausência de micronutriente sinaliza soma parcial, sem fingir que é zero", () => {
  const entry: FoodEntry = {
    id: "1",
    date: "2026-10-29",
    meal: "Almoço",
    foodId: 1,
    grams: 100,
  };
  const result = totalNutrient([entry], foods, "vitaminC");
  assert.equal(result.complete, false);
  assert.equal(result.known, 0);
  assert.equal(result.total, 1);
  assert.equal(totalNutrient([], foods, "vitaminC").complete, true);
  assert.equal(totalNutrient([entry], foods, "sodium").complete, true);
});
test("busca aceita acentos, termos em outra ordem e categoria", () => {
  assert.ok(searchFoods(foods, "cozido feijao").some((f) => f.id === 561));
  assert.deepEqual(searchFoods(foods, "banana", "Carnes e derivados"), []);
  assert.equal(searchFoods(foods, "alimento inexistente xyz").length, 0);
});
test("datas usam calendário local, incluindo virada de mês e ano", () => {
  assert.equal(dateKey(new Date(2026, 9, 29, 23, 55)), "2026-10-29");
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDate("2024-02-28", 1), "2024-02-29");
});
test("questionário muda frequência, duração, equipamento e estímulo", () => {
  const workouts = generateWorkouts(training);
  assert.equal(workouts.length, 3);
  assert.equal(workouts[0].exercises.length, 5);
  assert.equal(generateWorkouts({ ...training, days: 5 }).length, 5);
  assert.equal(
    generateWorkouts({ ...training, minutes: 30 })[0].exercises.length,
    4,
  );
  assert.equal(
    generateWorkouts({ ...training, minutes: 60 })[0].exercises.length,
    6,
  );
  assert.ok(
    generateWorkouts({ ...training, equipment: "home" })[0].exercises.some(
      (e) => e.name.includes("elástico"),
    ),
  );
  assert.equal(
    generateWorkouts({ ...training, goal: "conditioning" })[0].exercises[0]
      .reps,
    "12–15",
  );
  assert.equal(
    generateWorkouts({ ...training, experience: "intermediate" })[0]
      .exercises[0].sets,
    3,
  );
});
test("restrições impedem geração de treino e prancha usa segundos", () => {
  assert.deepEqual(generateWorkouts({ ...training, limitation: true }), []);
  const plank = generateWorkouts({
    ...training,
    minutes: 60,
    days: 4,
    equipment: "home",
  })
    .flatMap((w) => w.exercises)
    .find((e) => e.name === "Prancha");
  assert.ok(plank);
  assert.equal(plank.reps, "15–30 s");
});
