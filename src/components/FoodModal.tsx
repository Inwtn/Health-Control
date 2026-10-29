import { useState } from "react";
import { ArrowLeft, Check, Plus, Search, Utensils } from "lucide-react";
import { foods, useHealth } from "../store";
import { meals, nutrients, searchFoods } from "../lib/health";
import type { Food, MealName } from "../lib/types";
import { Modal, Note, number } from "./ui";

export function FoodModal({
  date,
  initialMeal = "Café da manhã",
  initialFood,
  onClose,
}: {
  date: string;
  initialMeal?: MealName;
  initialFood?: Food;
  onClose: () => void;
}) {
  const { setState, notify } = useHealth();
  const [query, setQuery] = useState("");
  const [food, setFood] = useState<Food | null>(initialFood ?? null);
  const [grams, setGrams] = useState("100");
  const [meal, setMeal] = useState<MealName>(initialMeal);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(30);
  const results = searchFoods(foods, query);
  const amount = Number(grams);
  return (
    <Modal
      title={food ? "Cada porção conta" : "O que você comeu?"}
      subtitle={`Registrar em ${new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")}`}
      onClose={onClose}
      wide
    >
      {!food ? (
        <div className="food-search">
          <label className="search-box">
            <Search size={19} />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(30);
              }}
              placeholder="Busque um alimento, ex.: arroz integral"
              aria-label="Buscar alimento"
            />
          </label>
          <div className="search-meta">
            <span>{results.length} alimentos encontrados</span>
            <span>Valores por 100 g · TACO</span>
          </div>
          <div className="food-results">
            {results.slice(0, limit).map((f) => (
              <button
                key={f.id}
                onClick={() => setFood(f)}
                className="food-result"
              >
                <span className="food-result-icon">
                  <Utensils size={17} />
                </span>
                <span>
                  <strong>{f.name}</strong>
                  <small>{f.category}</small>
                </span>
                <span className="food-result-kcal">
                  {f.nutrients.kcal === null ? "N/D" : number(f.nutrients.kcal)}{" "}
                  <small>kcal</small>
                </span>
                <Plus size={17} />
              </button>
            ))}
            {!results.length && (
              <div className="empty">
                <Search size={30} />
                <h3>Nenhum alimento por aqui</h3>
                <p>Tente outro termo ou procure sem informar a marca.</p>
              </div>
            )}
            {limit < results.length && (
              <button
                className="button secondary load-more"
                onClick={() => setLimit((n) => n + 30)}
              >
                Mostrar mais alimentos
              </button>
            )}
          </div>
          <p className="muted small">
            Escolha a preparação correta: cru, cozido e grelhado têm composições
            diferentes.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!Number.isFinite(amount) || amount <= 0 || amount > 3000) {
              setError("Informe uma quantidade de 1 a 3.000 g.");
              return;
            }
            setState((s) => ({
              ...s,
              entries: [
                ...s.entries,
                {
                  id: crypto.randomUUID(),
                  date,
                  meal,
                  foodId: food.id,
                  grams: amount,
                },
              ],
            }));
            notify(`${food.name} adicionado ao diário.`);
            onClose();
          }}
        >
          <div className="form-content">
            <button
              className="text-button"
              type="button"
              onClick={() => setFood(null)}
            >
              <ArrowLeft size={15} />
              Trocar alimento
            </button>
            <div className="selected-food">
              <span className="round-icon">
                <Utensils size={24} />
              </span>
              <div>
                <h3>{food.name}</h3>
                <span className="muted small">{food.category}</span>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                Quantidade (g)
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={3000}
                  step={1}
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Refeição
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as MealName)}
                >
                  {meals.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="portion-macros">
              {nutrients
                .filter((n) => n.group === "macro")
                .map((n) => (
                  <div key={n.key}>
                    <span>{n.label}</span>
                    <strong>
                      {food.nutrients[n.key] === null
                        ? "N/D"
                        : number(
                            (food.nutrients[n.key]! *
                              (Number.isFinite(amount) && amount > 0
                                ? amount
                                : 0)) /
                              100,
                            1,
                          )}{" "}
                      <small>{n.unit}</small>
                    </strong>
                  </div>
                ))}
            </div>
            <details className="nutrient-details">
              <summary>
                Ver fibras e todos os micronutrientes disponíveis
              </summary>
              <div className="nutrient-grid">
                {nutrients
                  .filter((n) => n.group !== "macro")
                  .map((n) => (
                    <div key={n.key}>
                      <span>{n.label}</span>
                      <strong>
                        {food.nutrients[n.key] === null
                          ? "N/D"
                          : number(
                              (food.nutrients[n.key]! *
                                (Number.isFinite(amount) && amount > 0
                                  ? amount
                                  : 0)) /
                                100,
                              2,
                            )}{" "}
                        <small>{n.unit}</small>
                      </strong>
                    </div>
                  ))}
              </div>
            </details>
            <Note>
              N/D = não disponível, não significa zero. A TACO não informa todas
              as vitaminas. Traços foram arredondados a zero na digitalização;
              RE e RAE são formas alternativas de vitamina A.
            </Note>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="button" type="submit">
              <Check size={17} />
              Adicionar ao diário
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
