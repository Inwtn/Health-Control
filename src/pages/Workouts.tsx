import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  Heart,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useHealth } from "../store";
import { dateKey, generateWorkouts } from "../lib/health";
import type { Training } from "../lib/types";
import { Modal, Note, Progress } from "../components/ui";

function TrainingForm({ onClose }: { onClose: () => void }) {
  const { state, setState, notify } = useHealth();
  const [draft, setDraft] = useState<Training>(
    state.training ?? {
      days: 3,
      experience: "beginner",
      minutes: 45,
      equipment: "gym",
      goal: "strength",
      limitation: false,
    },
  );
  const patch = <K extends keyof Training>(key: K, value: Training[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <Modal
      title="Vamos encontrar seu ritmo"
      subtitle="Seu ponto de partida importa mais que a carga."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setState((s) => ({ ...s, training: draft, completed: {} }));
          notify("Preferências de treino atualizadas.");
          onClose();
        }}
      >
        <div className="form-content">
          <div className="form-grid">
            <label className="field">
              Dias disponíveis na semana
              <select
                value={draft.days}
                onChange={(e) => patch("days", Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option value={n} key={n}>
                    {n} dias por semana
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Tempo por sessão
              <select
                value={draft.minutes}
                onChange={(e) =>
                  patch(
                    "minutes",
                    Number(e.target.value) as Training["minutes"],
                  )
                }
              >
                {[30, 45, 60].map((n) => (
                  <option value={n} key={n}>
                    {n} minutos
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Sua experiência
            <select
              value={draft.experience}
              onChange={(e) =>
                patch("experience", e.target.value as Training["experience"])
              }
            >
              <option value="beginner">Iniciante ou voltando agora</option>
              <option value="intermediate">Já treino com regularidade</option>
            </select>
          </label>
          <label className="field">
            Onde você vai treinar?
            <select
              value={draft.equipment}
              onChange={(e) =>
                patch("equipment", e.target.value as Training["equipment"])
              }
            >
              <option value="gym">Academia com aparelhos</option>
              <option value="home">Em casa, com elástico de resistência</option>
            </select>
          </label>
          <label className="field">
            Qual seu foco principal?
            <select
              value={draft.goal}
              onChange={(e) =>
                patch("goal", e.target.value as Training["goal"])
              }
            >
              <option value="strength">Força e ganho de massa</option>
              <option value="conditioning">
                Condicionamento e resistência
              </option>
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.limitation}
              onChange={(e) => patch("limitation", e.target.checked)}
            />
            <span>
              Tenho dor, lesão, gestação ou uma condição/restrição médica que
              precisa ser avaliada antes de treinar.
            </span>
          </label>
          <Note>
            Se houver restrições, não geramos uma rotina automática. Menores de
            18 anos também precisam de orientação presencial. Use a rotina como
            ponto de partida e revise a execução com um profissional.
          </Note>
          {state.training && (
            <p className="muted small">
              Ao salvar, as marcações de exercícios anteriores serão
              reiniciadas.
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button" type="submit">
            <Sparkles size={17} />
            Montar minha rotina
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Workouts() {
  const { state, setState, notify } = useHealth();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const t = state.training;
  const blocked = Boolean(
    t?.limitation || (state.profile && state.profile.age < 18),
  );
  const workouts = t && !blocked ? generateWorkouts(t) : [];
  const selected = Math.min(active, Math.max(0, workouts.length - 1));
  const workout = workouts[selected];
  const key = (index: number) => `${dateKey()}:${selected}:${index}`;
  const done =
    workout?.exercises.filter((_, i) => state.completed[key(i)]).length ?? 0;
  const days = t
    ? ({
        2: [0, 3],
        3: [0, 2, 4],
        4: [0, 1, 3, 4],
        5: [0, 1, 2, 3, 4],
        6: [0, 1, 2, 3, 4, 5],
      }[t.days as 2 | 3 | 4 | 5 | 6] ?? [])
    : [];
  return (
    <>
      <div className="page-toolbar">
        <div>
          <h2>Movimento que faz bem.</h2>
          <p>Um treino possível é aquele que cabe na sua vida.</p>
        </div>
        {t && (
          <button className="button secondary" onClick={() => setOpen(true)}>
            <Settings2 size={17} />
            Ajustar treino
          </button>
        )}
      </div>
      {!t ? (
        <section className="card workout-onboarding">
          <div className="workout-illustration">
            <Dumbbell size={72} strokeWidth={1.2} />
            <span>
              <Sparkles size={20} />
            </span>
          </div>
          <span className="eyebrow">UM COMEÇO NO SEU RITMO</span>
          <h2>
            Seu corpo foi feito
            <br />
            para se movimentar.
          </h2>
          <p>
            Conte sobre sua experiência, seus objetivos e o tempo disponível.
            Vamos organizar uma rotina inicial para você.
          </p>
          <div className="onboarding-tags">
            <span>
              <Clock3 size={15} />
              30 a 60 minutos
            </span>
            <span>
              <Heart size={15} />
              Respeito ao seu ritmo
            </span>
          </div>
          <button className="button" onClick={() => setOpen(true)}>
            Montar meu treino
            <ArrowRight size={17} />
          </button>
        </section>
      ) : blocked ? (
        <section className="card supervision-card">
          <Heart size={32} />
          <h2>Vamos cuidar do seu ponto de partida.</h2>
          <p>
            Uma restrição ou a idade informada pede avaliação presencial.
            Procure orientação para definir exercícios e cargas seguros antes de
            gerar sua rotina.
          </p>
          <button className="button secondary" onClick={() => setOpen(true)}>
            Revisar minhas respostas
          </button>
        </section>
      ) : (
        <>
          <div className="workout-summary">
            <span className="pill">
              <Dumbbell size={14} />
              {t.days} dias por semana
            </span>
            <span className="pill">
              <Clock3 size={14} />
              {t.minutes} min por sessão, aproximadamente
            </span>
            <span className="pill">
              {t.experience === "beginner" ? "Iniciante" : "Intermediário"}
            </span>
            <span className="pill">
              {t.equipment === "gym" ? "Academia" : "Em casa com elástico"}
            </span>
          </div>
          <section className="card week-card">
            <div className="card-heading">
              <h3>Sua semana, com espaço para recuperar</h3>
              <span className="muted small">Sugestão de distribuição</span>
            </div>
            <div className="week-grid">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                (day, i) => {
                  const index = days.indexOf(i);
                  return index >= 0 ? (
                    <button
                      className={`week-day ${selected === index ? "active" : ""}`}
                      key={day}
                      onClick={() => setActive(index)}
                    >
                      <span>{day}</span>
                      <Dumbbell size={21} />
                      <strong>Treino {String.fromCharCode(65 + index)}</strong>
                    </button>
                  ) : (
                    <div className="week-day rest" key={day}>
                      <span>{day}</span>
                      <Heart size={19} />
                      <small>Recuperação</small>
                    </div>
                  );
                },
              )}
            </div>
          </section>
          {workout && (
            <section className="card exercises-card">
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    {workout.name.toUpperCase()} · {workout.focus.toUpperCase()}
                  </span>
                  <h2>Faça do seu jeito. Com constância.</h2>
                </div>
                <span className="pill">
                  {done} de {workout.exercises.length} hoje
                </span>
              </div>
              <Progress value={done} goal={workout.exercises.length} />
              <div className="warmup">
                <RotateCcw size={19} />
                <div>
                  <strong>Comece com 5–8 minutos de aquecimento</strong>
                  <p>
                    Caminhada ou bicicleta leve e uma série leve dos primeiros
                    movimentos.
                  </p>
                </div>
              </div>
              <div className="exercise-list">
                {workout.exercises.map((exercise, i) => (
                  <div
                    className={`exercise ${state.completed[key(i)] ? "complete" : ""}`}
                    key={`${selected}:${exercise.name}`}
                  >
                    <button
                      className="exercise-check"
                      aria-label={`${state.completed[key(i)] ? "Desmarcar" : "Concluir"} ${exercise.name}`}
                      aria-pressed={Boolean(state.completed[key(i)])}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          completed: {
                            ...s.completed,
                            [key(i)]: !s.completed[key(i)],
                          },
                        }));
                        if (
                          !state.completed[key(i)] &&
                          done + 1 === workout.exercises.length
                        )
                          notify(
                            "Treino de hoje registrado. Reserve um tempo para recuperar.",
                          );
                      }}
                    >
                      {state.completed[key(i)] ? (
                        <CheckCircle2 size={25} />
                      ) : (
                        <Circle size={25} />
                      )}
                    </button>
                    <span className="exercise-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{exercise.name}</h3>
                      <p>{exercise.note}</p>
                    </div>
                    <div className="exercise-prescription">
                      <strong>
                        {exercise.sets} × {exercise.reps}
                      </strong>
                      <span>Descanso: {exercise.rest}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="workout-finish">
                <Check size={16} />
                {done === workout.exercises.length
                  ? "Sessão registrada hoje. Você respeitou seu compromisso."
                  : "Marque cada exercício após concluir. Os registros são separados por dia."}
              </div>
            </section>
          )}
          <Note>
            Respeite a recuperação entre sessões do mesmo grupo muscular. Ajuste
            as cargas com orientação, sem dor e sem chegar à falha. O tempo é
            aproximado; o cronograma é uma sugestão, sem progressão automática
            de carga.
          </Note>
        </>
      )}
      {open && (
        <TrainingForm
          onClose={() => {
            setOpen(false);
            setActive(0);
          }}
        />
      )}
    </>
  );
}
