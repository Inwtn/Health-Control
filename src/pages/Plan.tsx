import {
  ArrowRight,
  Check,
  ChevronDown,
  Flame,
  Heart,
  Plus,
  Scale,
  Sprout,
  Target,
  Zap,
} from "lucide-react";
import { foods, useHealth } from "../store";
import {
  activityLevels,
  calculatePlan,
  goalNames,
  meals,
  totalNutrient,
} from "../lib/health";
import type { Food, FoodEntry } from "../lib/types";
import { EmptyPlan } from "../components/Nutrition";
import { Note, number, SectionTitle } from "../components/ui";

export function Plan({
  date,
  onProfile,
  onFood,
}: {
  date: string;
  onProfile: () => void;
  onFood: (food: Food) => void;
}) {
  const { state, setState, notify } = useHealth();
  const p = state.profile;
  if (!p)
    return (
      <section className="card">
        <EmptyPlan onProfile={onProfile} />
      </section>
    );
  const plan = calculatePlan(p);
  const protein = p.diet === "all" ? 410 : p.diet === "vegetarian" ? 488 : 584;
  const template = [
    [[7, 50], [182, 120], p.diet === "vegan" ? [557, 20] : [448, 170]],
    [
      [1, 160],
      [561, 150],
      [protein, p.diet === "vegan" ? 220 : 120],
      [100, 100],
      [260, 8],
    ],
    [
      [225, 200],
      [557, 25],
    ],
    [
      [577, 150],
      [88, 180],
      [protein, p.diet === "vegan" ? 220 : 100],
      [78, 80],
      [260, 8],
    ],
  ];
  const baseCalories = template
    .flat()
    .reduce(
      (sum, [id, grams]) =>
        sum +
        ((foods.find((f) => f.id === id)!.nutrients.kcal ?? 0) * grams) / 100,
      0,
    );
  const suggested: FoodEntry[][] = template.map((items, i) =>
    items.map(([foodId, grams]) => ({
      id: "",
      foodId,
      grams: Math.max(
        5,
        Math.round(
          (grams * (plan.calories ?? baseCalories)) / baseCalories / 5,
        ) * 5,
      ),
      date,
      meal: meals[i],
    })),
  );
  const all = suggested.flat();
  return (
    <>
      <div className="page-toolbar">
        <div>
          <h2>Um plano que começa em você.</h2>
          <p>Conheça suas estimativas e transforme informação em rotina.</p>
        </div>
        <button className="button secondary" onClick={onProfile}>
          Atualizar perfil
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="plan-metrics">
        {[
          {
            icon: Flame,
            title: "Metabolismo basal",
            value: number(plan.basal),
            unit: "kcal/dia",
            text: "Energia estimada do corpo em repouso",
          },
          {
            icon: Zap,
            title: "Gasto diário estimado",
            value: number(plan.expenditure),
            unit: "kcal/dia",
            text: activityLevels[p.activity].label,
          },
          {
            icon: Target,
            title: "Objetivo de energia",
            value: plan.calories ? number(plan.calories) : "—",
            unit: "kcal/dia",
            text: plan.supervised
              ? "Definir com acompanhamento"
              : goalNames[p.goal],
          },
        ].map(({ icon: Icon, title, value, unit, text }) => (
          <section className="card metric-card" key={title}>
            <span className="round-icon pale">
              <Icon size={21} />
            </span>
            <span>{title}</span>
            <strong>
              {value}
              <small>{unit}</small>
            </strong>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <details className="card calculation-details">
        <summary>
          Como calculamos suas estimativas?
          <ChevronDown size={17} />
        </summary>
        <div>
          <p>
            <strong>Mifflin–St Jeor:</strong> 10 × peso (kg) + 6,25 × altura
            (cm) − 5 × idade + {p.sex === "male" ? "5" : "(−161)"}. O gasto
            diário é o basal multiplicado por{" "}
            {number(activityLevels[p.activity].factor, 3)} conforme sua rotina.
          </p>
          <p>
            Para adultos sem indicação de supervisão, usamos manutenção do
            gasto, déficit de 15% ou acréscimo de 10%. Aplicamos um limite
            automático de 1.200 kcal (feminino) ou 1.500 kcal (masculino), que
            não garante adequação individual. Proteína: 1,4–1,6 g/kg, limitada a
            35% da energia; gorduras: 30%; carboidratos: energia restante.
          </p>
          <p>
            São aproximações, não medições. Não definimos prazo para mudanças de
            peso. Referência: Mifflin et al., American Journal of Clinical
            Nutrition, 1990, 51(2):241–247, DOI 10.1093/ajcn/51.2.241.
          </p>
        </div>
      </details>
      {plan.supervised ? (
        <div className="card supervision-card">
          <Heart size={32} />
          <h2>Seu cuidado merece um plano individual.</h2>
          <p>
            Para menores de 18 anos, gestação, amamentação, condições clínicas
            ou peso fora das faixas de aplicação deste estimador, as metas
            alimentares devem ser definidas com um profissional.
          </p>
          <p>
            Seu diário, a busca de alimentos e a hidratação continuam
            disponíveis. Os valores de metabolismo acima são apenas
            informativos.
          </p>
        </div>
      ) : (
        <>
          <section className="card plan-targets">
            <SectionTitle title="Uma direção para o seu dia">
              <span className="pill">
                <Target size={13} />
                {goalNames[p.goal]}
              </span>
            </SectionTitle>
            <div className="target-grid">
              <div>
                <i className="dot protein" />
                <span>Proteínas</span>
                <strong>
                  {plan.protein} <small>g</small>
                </strong>
              </div>
              <div>
                <i className="dot carbs" />
                <span>Carboidratos</span>
                <strong>
                  {plan.carbs} <small>g</small>
                </strong>
              </div>
              <div>
                <i className="dot fat" />
                <span>Gorduras</span>
                <strong>
                  {plan.fat} <small>g</small>
                </strong>
              </div>
              {p.targetWeight && (
                <div>
                  <Scale size={16} />
                  <span>Peso desejado</span>
                  <strong>
                    {number(p.targetWeight, 1)} <small>kg</small>
                  </strong>
                </div>
              )}
            </div>
          </section>
          <div className="section-title plan-section">
            <div>
              <span className="eyebrow">IDEIAS PARA ORGANIZAR SUA ROTINA</span>
              <h2>Equilíbrio à mesa</h2>
            </div>
            <span className="pill">
              <Sprout size={13} />
              {p.diet === "vegan"
                ? "Vegana"
                : p.diet === "vegetarian"
                  ? "Vegetariana"
                  : "Variada"}
            </span>
          </div>
          <p className="muted plan-explanation">
            Exemplo de refeições com porções ajustadas à estimativa de energia.
            Os macros do exemplo podem diferir das metas; ajuste os alimentos
            com orientação conforme sua rotina e preferências.
          </p>
          <div className="meal-plan-grid">
            {suggested.map((entries, i) => {
              const already = entries.every((e) =>
                state.entries.some(
                  (s) =>
                    s.date === date &&
                    s.meal === e.meal &&
                    s.foodId === e.foodId &&
                    s.grams === e.grams,
                ),
              );
              return (
                <section className="card meal-plan" key={meals[i]}>
                  <div className="meal-plan-heading">
                    <span className="eyebrow">0{i + 1}</span>
                    <h3>{meals[i]}</h3>
                    <strong>
                      {number(totalNutrient(entries, foods, "kcal").value)}{" "}
                      <small>kcal</small>
                    </strong>
                  </div>
                  <div className="suggested-foods">
                    {entries.map((e) => (
                      <button
                        key={e.foodId}
                        onClick={() =>
                          onFood(foods.find((f) => f.id === e.foodId)!)
                        }
                      >
                        <span>
                          {foods.find((f) => f.id === e.foodId)!.name}
                        </span>
                        <strong>{e.grams} g</strong>
                      </button>
                    ))}
                  </div>
                  <div className="meal-plan-macros">
                    <span>
                      P{" "}
                      <strong>
                        {number(
                          totalNutrient(entries, foods, "protein").value,
                          1,
                        )}{" "}
                        g
                      </strong>
                    </span>
                    <span>
                      C{" "}
                      <strong>
                        {number(
                          totalNutrient(entries, foods, "carbohydrates").value,
                          1,
                        )}{" "}
                        g
                      </strong>
                    </span>
                    <span>
                      G{" "}
                      <strong>
                        {number(
                          totalNutrient(entries, foods, "lipids").value,
                          1,
                        )}{" "}
                        g
                      </strong>
                    </span>
                  </div>
                  <button
                    className="button secondary full-width"
                    disabled={already}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        entries: [
                          ...s.entries,
                          ...entries.map((e) => ({
                            ...e,
                            id: crypto.randomUUID(),
                          })),
                        ],
                      }));
                      notify(
                        `${meals[i]} registrado em ${new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")}.`,
                      );
                    }}
                  >
                    {already ? <Check size={16} /> : <Plus size={16} />}
                    {already
                      ? "Refeição já registrada"
                      : "Registrar refeição no dia"}
                  </button>
                </section>
              );
            })}
          </div>
          <section className="card suggested-totals">
            <span>Este exemplo soma</span>
            {(["kcal", "protein", "carbohydrates", "lipids"] as const).map(
              (k, i) => (
                <strong key={k}>
                  {number(totalNutrient(all, foods, k).value, i === 0 ? 0 : 1)}{" "}
                  <small>
                    {["kcal", "g proteínas", "g carboidratos", "g gorduras"][i]}
                  </small>
                </strong>
              ),
            )}
          </section>
          <Note>
            Sugestões educativas, sem avaliação de alergias ou restrições
            clínicas. Clique nos alimentos para consultar nutrientes e registrar
            outra porção. Uma dieta individual e a adequação de vitaminas e
            minerais exigem avaliação profissional.
          </Note>
        </>
      )}
    </>
  );
}
