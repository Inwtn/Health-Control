import { Plus } from "lucide-react";
import type { MealName } from "../lib/types";
import { EnergyCard, MealList, Micronutrients } from "../components/Nutrition";
import { WaterCard } from "../components/WaterCard";
import { DatePicker, SectionTitle } from "../components/ui";

export function Diary({
  date,
  setDate,
  onAdd,
}: {
  date: string;
  setDate: (date: string) => void;
  onAdd: (meal?: MealName) => void;
}) {
  return (
    <>
      <div className="page-toolbar">
        <div>
          <h2>O que nutriu o seu dia?</h2>
          <p>Registre suas escolhas e acompanhe o que faz parte delas.</p>
        </div>
        <DatePicker value={date} onChange={setDate} />
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <EnergyCard date={date} />
          <section className="card meals-card">
            <SectionTitle title="Diário alimentar">
              <button className="button small-button" onClick={() => onAdd()}>
                <Plus size={16} />
                Adicionar alimento
              </button>
            </SectionTitle>
            <MealList date={date} onAdd={onAdd} />
          </section>
          <Micronutrients date={date} all />
        </div>
        <aside className="dashboard-side">
          <WaterCard date={date} expanded />
          <div className="card diary-tip">
            <span className="eyebrow">SEM JULGAMENTOS</span>
            <h3>Registrar é conhecer.</h3>
            <p>
              Observe seus hábitos com curiosidade. Seu diário é um espaço de
              cuidado, não de cobrança.
            </p>
            <p className="small muted">
              Use as setas de data para consultar ou completar dias anteriores.
              Cada registro fica salvo na data selecionada.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
