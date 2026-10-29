import { useState } from "react";
import {
  Check,
  Droplets,
  GlassWater,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useHealth } from "../store";
import { Modal, Note, number, Progress } from "./ui";

export function WaterCard({
  date,
  expanded = false,
}: {
  date: string;
  expanded?: boolean;
}) {
  const { state, setState, notify } = useHealth();
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [custom, setCustom] = useState("250");
  const [goal, setGoal] = useState(state.waterGoal.toString());
  const [error, setError] = useState("");
  const entries = state.water.filter((w) => w.date === date);
  const total = entries.reduce((sum, w) => sum + w.ml, 0);
  function add(ml: number) {
    if (!Number.isInteger(ml) || ml < 1 || ml > 3000) {
      setError("Informe uma quantidade entre 1 e 3.000 ml.");
      return;
    }
    setState((s) => ({
      ...s,
      water: [
        ...s.water,
        {
          id: crypto.randomUUID(),
          date,
          ml,
          time: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    }));
    notify(`${number(ml)} ml de água registrados.`);
    setError("");
  }
  return (
    <>
      <section className={`card water-card ${expanded ? "expanded" : ""}`}>
        <div className="card-heading">
          <span className="round-icon blue">
            <Droplets size={21} />
          </span>
          <h3>Um gole de cuidado</h3>
          <button
            className="icon-button"
            aria-label="Editar meta de água"
            onClick={() => {
              setGoal(String(state.waterGoal));
              setEditingGoal(true);
              setError("");
            }}
          >
            <Pencil size={15} />
          </button>
        </div>
        <div className="water-summary">
          <div>
            <strong>
              {number(total / 1000, 2)}
              <small> / {number(state.waterGoal / 1000, 2)} L</small>
            </strong>
            <p>
              {total >= state.waterGoal
                ? "Meta pessoal alcançada hoje!"
                : `Mais ${number(Math.max(0, state.waterGoal - total))} ml para sua meta`}
            </p>
          </div>
          <div className="water-glass">
            <GlassWater size={54} strokeWidth={1.3} />
          </div>
        </div>
        <Progress value={total} goal={state.waterGoal} color="blue" />
        <div className="water-buttons">
          {[200, 350, 500].map((ml) => (
            <button key={ml} onClick={() => add(ml)}>
              <Plus size={13} />
              {ml} ml
            </button>
          ))}
          <button
            aria-label="Registrar outra quantidade de água"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        {expanded && (
          <div className="water-history">
            <div className="card-heading">
              <h4>Registros do dia</h4>
              <button className="text-button" onClick={() => setOpen(true)}>
                Outra quantidade
              </button>
            </div>
            {!entries.length && (
              <p className="muted small">
                Seus copos e garrafas aparecem aqui.
              </p>
            )}
            {entries.map((w) => (
              <div key={w.id}>
                <span>
                  <Droplets size={15} />
                  {number(w.ml)} ml <small>{w.time}</small>
                </span>
                <button
                  className="icon-button danger"
                  aria-label={`Excluir registro de ${w.ml} ml`}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      water: s.water.filter((e) => e.id !== w.id),
                    }));
                    notify("Registro de água excluído.");
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      {open && (
        <Modal
          title="Mais água no seu dia"
          subtitle="Informe o volume que você bebeu."
          onClose={() => setOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ml = Number(custom);
              if (Number.isInteger(ml) && ml >= 1 && ml <= 3000) {
                add(ml);
                setOpen(false);
              } else setError("Informe uma quantidade entre 1 e 3.000 ml.");
            }}
          >
            <div className="form-content">
              <label className="field">
                Quantidade de água (ml)
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={3000}
                  step={1}
                  required
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="button" type="submit">
                <Plus size={17} />
                Registrar água
              </button>
            </div>
          </form>
        </Modal>
      )}
      {editingGoal && (
        <Modal
          title="Sua meta de hidratação"
          subtitle="Uma meta pessoal que cabe na sua rotina."
          onClose={() => setEditingGoal(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ml = Number(goal);
              if (!Number.isInteger(ml) || ml < 250 || ml > 8000) {
                setError("Escolha uma meta entre 250 e 8.000 ml.");
                return;
              }
              setState((s) => ({ ...s, waterGoal: ml }));
              notify("Meta de água atualizada.");
              setEditingGoal(false);
            }}
          >
            <div className="form-content">
              <label className="field">
                Meta diária (ml)
                <input
                  autoFocus
                  type="number"
                  min={250}
                  max={8000}
                  step={1}
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </label>
              <Note>
                O valor inicial de 2 L é apenas uma referência ajustável. A
                necessidade varia com clima, atividade, alimentação e orientação
                de saúde; não é necessário beber tudo de uma vez.
              </Note>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setEditingGoal(false)}
              >
                Cancelar
              </button>
              <button className="button" type="submit">
                <Check size={17} />
                Salvar meta
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
