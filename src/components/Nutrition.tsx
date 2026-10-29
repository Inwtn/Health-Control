import {
  ArrowUpRight,
  Coffee,
  Flame,
  Moon,
  Plus,
  Sprout,
  Sun,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { foods, useHealth } from "../store";
import { calculatePlan, meals, nutrients, totalNutrient } from "../lib/health";
import type { FoodEntry, MealName, NutrientKey } from "../lib/types";
import { number, Progress } from "./ui";

export function EnergyCard({ date }: { date: string }) {
  const { state } = useHealth();
  const entries = state.entries.filter((e) => e.date === date);
  const plan = state.profile ? calculatePlan(state.profile) : null;
  const energy = totalNutrient(entries, foods, "kcal");
  const progress = plan?.calories
    ? Math.min(1, energy.value / plan.calories)
    : 0;
  const macro = (key: NutrientKey) => totalNutrient(entries, foods, key);
  return (
    <section className="card energy-card">
      <div className="card-heading">
        <Flame size={18} />
        <h3>Sua nutrição hoje</h3>
        <span className="pill">
          {entries.length} {entries.length === 1 ? "alimento" : "alimentos"}
        </span>
      </div>
      <div className="energy-body">
        <div className="calorie-ring">
          <svg viewBox="0 0 164 164" aria-hidden="true">
            <circle cx="82" cy="82" r="69" className="ring-track" />
            <circle
              cx="82"
              cy="82"
              r="69"
              className="ring-value"
              strokeDasharray={`${progress * 433.54} 433.54`}
            />
          </svg>
          <div>
            <Flame size={18} />
            <strong>{number(energy.value)}</strong>
            <span>kcal consumidas{!energy.complete && "*"}</span>
          </div>
        </div>
        <div className="energy-detail">
          <span className="eyebrow">UM DIA, UM PASSO</span>
          <h3>
            {plan?.calories
              ? `${number(Math.abs(plan.calories - energy.value))} kcal`
              : "Seu equilíbrio começa aqui"}
          </h3>
          <p>
            {plan?.calories
              ? energy.value > plan.calories
                ? "acima da estimativa diária. Observe sua rotina ao longo do tempo."
                : "para a sua estimativa diária de energia."
              : "Crie seu perfil para conhecer suas necessidades estimadas."}
          </p>
          <span className="energy-target">
            Meta diária{" "}
            <strong>
              {plan?.calories
                ? `${number(plan.calories)} kcal`
                : "Ainda não definida"}
            </strong>
          </span>
        </div>
      </div>
      <div className="macro-row">
        {(
          [
            {
              key: "protein",
              label: "Proteínas",
              goal: plan?.protein ?? null,
              color: "green",
              dot: "protein",
            },
            {
              key: "carbohydrates",
              label: "Carboidratos",
              goal: plan?.carbs ?? null,
              color: "gold",
              dot: "carbs",
            },
            {
              key: "lipids",
              label: "Gorduras",
              goal: plan?.fat ?? null,
              color: "clay",
              dot: "fat",
            },
          ] as const
        ).map((m) => (
          <div className="macro-item" key={m.key}>
            <span>
              <i className={`dot ${m.dot}`} />
              {m.label}
            </span>
            <strong>
              {number(macro(m.key).value, 1)}
              <small>
                {" "}
                / {m.goal ?? "—"} g{!macro(m.key).complete && "*"}
              </small>
            </strong>
            <Progress
              value={macro(m.key).value}
              goal={m.goal}
              color={m.color}
            />
          </div>
        ))}
      </div>
      {nutrients
        .filter((n) => n.group === "macro")
        .some((n) => !totalNutrient(entries, foods, n.key).complete) && (
        <p className="partial-note">
          * Total parcial: há alimentos sem esse dado na base.
        </p>
      )}
    </section>
  );
}
const mealIcons = [Coffee, Sun, Sprout, Moon];
export function MealList({
  date,
  onAdd,
  compact = false,
}: {
  date: string;
  onAdd: (meal: MealName) => void;
  compact?: boolean;
}) {
  const { state, setState, notify } = useHealth();
  return (
    <div className={`meal-list ${compact ? "compact" : ""}`}>
      {meals.map((meal, index) => {
        const entries = state.entries.filter(
          (e) => e.date === date && e.meal === meal,
        );
        const Icon = mealIcons[index];
        const energy = totalNutrient(entries, foods, "kcal");
        return (
          <section className="meal" key={meal}>
            <div className="meal-heading">
              <span className={`meal-icon meal-${index}`}>
                <Icon size={20} />
              </span>
              <div>
                <h3>{meal}</h3>
                <p>
                  {entries.length
                    ? `${entries.length} ${entries.length === 1 ? "alimento registrado" : "alimentos registrados"}`
                    : "Pronto para o seu próximo registro"}
                </p>
              </div>
              <span className="meal-kcal">
                {entries.length
                  ? `${number(energy.value)}${energy.complete ? "" : "*"} kcal`
                  : "— kcal"}
              </span>
              <button
                className="icon-button outlined"
                onClick={() => onAdd(meal)}
                aria-label={`Adicionar alimento em ${meal}`}
              >
                <Plus size={17} />
              </button>
            </div>
            {entries.length > 0 && (
              <div className="meal-entries">
                {entries.map((e) => (
                  <div className="meal-entry" key={e.id}>
                    <span>
                      <strong>
                        {foods.find((f) => f.id === e.foodId)?.name}
                      </strong>
                      <small>{number(e.grams)} g</small>
                    </span>
                    <span>{foodEnergy(e, "kcal")} kcal</span>
                    <button
                      className="icon-button danger"
                      aria-label={`Excluir ${foods.find((f) => f.id === e.foodId)?.name}`}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          entries: s.entries.filter((item) => item.id !== e.id),
                        }));
                        notify("Alimento removido do diário.");
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
function foodEnergy(e: FoodEntry, key: NutrientKey) {
  const v = foods.find((f) => f.id === e.foodId)?.nutrients[key];
  return v === null || v === undefined ? "N/D" : number((v * e.grams) / 100, 1);
}
export function Micronutrients({
  date,
  all = false,
  onExpand,
}: {
  date: string;
  all?: boolean;
  onExpand?: () => void;
}) {
  const { state } = useHealth();
  const entries = state.entries.filter((e) => e.date === date);
  const selected = all
    ? nutrients.filter((n) => n.group !== "macro")
    : nutrients.filter((n) =>
        ["dietaryFiber", "calcium", "iron", "vitaminC"].includes(n.key),
      );
  return (
    <section className="card micro-card">
      <div className="card-heading">
        <span className="round-icon pale">
          <Sprout size={19} />
        </span>
        <div>
          <h3>{all ? "Além dos macros" : "Nutrientes em foco"}</h3>
          <p>Pequenos nutrientes, grandes cuidados.</p>
        </div>
        {onExpand && (
          <button
            className="icon-button"
            onClick={onExpand}
            aria-label="Ver todos os nutrientes"
          >
            <ArrowUpRight size={19} />
          </button>
        )}
      </div>
      <div className={`micro-list ${all ? "all" : ""}`}>
        {selected.map((n) => {
          const total = totalNutrient(entries, foods, n.key);
          return (
            <div key={n.key} title={`Dados disponíveis para ${total.known} de ${total.total} alimentos`}>
              <span>{n.label}</span>
              <strong>
                {total.total > 0 && total.known === 0 ? 'N/D' : number(total.value, n.key === "iron" ? 2 : 1)}{" "}
                <small>
                  {n.unit}
                  {!total.complete ? "*" : ""}
                </small>
              </strong>
            </div>
          );
        })}
      </div>
      <p className="muted micro-footnote">
        {entries.length
          ? "* Totais parciais quando há dados ausentes. Zero pode incluir traços. RE, RAE e retinol não devem ser somados."
          : "Adicione alimentos para acompanhar os nutrientes do dia."}
      </p>
      {all && (
        <p className="muted micro-footnote">
          Fonte: TACO, 4ª edição (2011). Vitaminas D, E, K e B12 não estão
          disponíveis nesta base. Os valores não confirmam adequação
          nutricional.
        </p>
      )}
    </section>
  );
}
export function EmptyPlan({ onProfile }: { onProfile: () => void }) {
  return (
    <div className="empty-plan">
      <span className="round-icon">
        <UtensilsCrossed size={23} />
      </span>
      <h3>Um plano com a sua medida</h3>
      <p>
        Conte um pouco sobre você para conhecer seu gasto energético e organizar
        a alimentação.
      </p>
      <button className="button" onClick={onProfile}>
        Criar meu plano
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
