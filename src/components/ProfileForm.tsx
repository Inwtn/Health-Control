import { useState } from "react";
import {
  ArrowRight,
  Heart,
  Ruler,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useHealth } from "../store";
import { activityLevels, validateProfile } from "../lib/health";
import type { Profile } from "../lib/types";
import { Modal, Note } from "./ui";

export function ProfileForm({ onClose }: { onClose: () => void }) {
  const { state, setState, notify } = useHealth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: state.profile?.name ?? "",
    age: state.profile?.age.toString() ?? "",
    height: state.profile?.height.toString() ?? "",
    weight: state.profile?.weight.toString() ?? "",
    sex: state.profile?.sex ?? "female",
    activity: state.profile?.activity ?? "light",
    weeklyActivity: state.profile?.weeklyActivity ?? 3,
    goal: state.profile?.goal ?? "maintain",
    diet: state.profile?.diet ?? "all",
    targetWeight: state.profile?.targetWeight?.toString() ?? "",
    needsSupervision: state.profile?.needsSupervision ?? false,
  });
  const patch = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));
  const profile = (): Profile => ({
    ...draft,
    name: draft.name.trim(),
    age: Number(draft.age),
    height: Number(draft.height),
    weight: Number(draft.weight),
    targetWeight:
      draft.targetWeight && draft.goal !== "maintain"
        ? Number(draft.targetWeight)
        : null,
  });
  function next() {
    const e = validateProfile({ ...profile(), targetWeight: null });
    if (e) {
      setError(e);
      return;
    }
    setError("");
    setStep(1);
  }
  function save() {
    const p = profile();
    const e = validateProfile(p);
    if (e) {
      setError(e);
      return;
    }
    setState((s) => ({ ...s, profile: p }));
    notify("Perfil salvo. Seu plano foi atualizado.");
    onClose();
  }
  return (
    <Modal
      title={
        state.profile
          ? "Seu perfil, sempre atualizado"
          : "Vamos começar por você"
      }
      subtitle="Algumas informações para traçar o seu próximo passo."
      onClose={onClose}
    >
      <div className="stepper">
        <span className={step === 0 ? "active" : "done"}>
          1 <span>Sobre você</span>
        </span>
        <div />
        <span className={step === 1 ? "active" : ""}>
          2 <span>Seus objetivos</span>
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) next();
          else save();
        }}
      >
        {step === 0 ? (
          <div className="form-content">
            <label className="field">
              Como podemos chamar você?
              <div className="input-with-icon">
                <UserRound size={18} />
                <input
                  autoComplete="given-name"
                  value={draft.name}
                  onChange={(e) => patch("name", e.target.value)}
                  placeholder="Seu primeiro nome"
                  maxLength={60}
                  required
                />
              </div>
            </label>
            <div className="form-grid">
              <label className="field">
                Idade
                <input
                  type="number"
                  min={14}
                  max={100}
                  step={1}
                  required
                  value={draft.age}
                  onChange={(e) => patch("age", e.target.value)}
                  placeholder="Anos"
                />
              </label>
              <label className="field">
                Sexo usado na fórmula
                <select
                  value={draft.sex}
                  onChange={(e) =>
                    patch("sex", e.target.value as Profile["sex"])
                  }
                >
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                Peso atual (kg)
                <div className="input-with-icon">
                  <Scale size={18} />
                  <input
                    type="number"
                    min={30}
                    max={350}
                    step="0.1"
                    required
                    value={draft.weight}
                    onChange={(e) => patch("weight", e.target.value)}
                    placeholder="Ex.: 70"
                  />
                </div>
              </label>
              <label className="field">
                Altura (cm)
                <div className="input-with-icon">
                  <Ruler size={18} />
                  <input
                    type="number"
                    min={120}
                    max={230}
                    step="0.1"
                    required
                    value={draft.height}
                    onChange={(e) => patch("height", e.target.value)}
                    placeholder="Ex.: 170"
                  />
                </div>
              </label>
            </div>
            <label className="field">
              Quantas vezes faz atividade na semana?
              <select
                value={draft.weeklyActivity}
                onChange={(e) => {
                  const frequency = Number(e.target.value);
                  setDraft((d) => ({
                    ...d,
                    weeklyActivity: frequency,
                    activity:
                      frequency === 0
                        ? "sedentary"
                        : frequency <= 3
                          ? "light"
                          : frequency <= 5
                            ? "moderate"
                            : "high",
                  }));
                }}
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0
                      ? "Nenhuma atividade regular"
                      : `${i} ${i === 1 ? "vez" : "vezes"} por semana`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Intensidade e movimento da sua rotina
              <select
                value={draft.activity}
                onChange={(e) =>
                  patch("activity", e.target.value as Profile["activity"])
                }
              >
                {Object.entries(activityLevels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label} · {value.detail}
                  </option>
                ))}
              </select>
            </label>
            <Note>
              A frequência de exercícios e o movimento no dia a dia influenciam
              o gasto estimado. O sexo é um parâmetro da fórmula de Mifflin–St
              Jeor.
            </Note>
          </div>
        ) : (
          <div className="form-content">
            <span className="field-label">O que você quer alcançar?</span>
            <div className="goal-options">
              {(
                [
                  {
                    key: "lose",
                    label: "Reduzir peso",
                    detail: "Um déficit moderado e sustentável",
                    icon: Scale,
                  },
                  {
                    key: "maintain",
                    label: "Manter o equilíbrio",
                    detail: "Mais consciência e uma rotina saudável",
                    icon: Heart,
                  },
                  {
                    key: "gain",
                    label: "Ganhar massa",
                    detail: "Alimentação para acompanhar seus treinos",
                    icon: Sparkles,
                  },
                ] as const
              ).map(({ key, label, detail, icon: Icon }) => (
                <label
                  className={`choice ${draft.goal === key ? "selected" : ""}`}
                  key={key}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={key}
                    checked={draft.goal === key}
                    onChange={() => patch("goal", key)}
                  />
                  <Icon size={22} />
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                </label>
              ))}
            </div>
            {draft.goal !== "maintain" && (
              <label className="field">
                Peso desejado (kg) <small>Opcional, sem prazo automático</small>
                <input
                  type="number"
                  min={30}
                  max={350}
                  step="0.1"
                  value={draft.targetWeight}
                  onChange={(e) => patch("targetWeight", e.target.value)}
                  placeholder="Defina um objetivo pessoal"
                />
              </label>
            )}
            <label className="field">
              Preferência alimentar
              <select
                value={draft.diet}
                onChange={(e) =>
                  patch("diet", e.target.value as Profile["diet"])
                }
              >
                <option value="all">Sem preferência específica</option>
                <option value="vegetarian">
                  Vegetariana (com ovos e leite)
                </option>
                <option value="vegan">Vegana</option>
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={draft.needsSupervision}
                onChange={(e) => patch("needsSupervision", e.target.checked)}
              />
              <span>
                Estou grávida, amamentando ou tenho uma condição de saúde que
                exige acompanhamento alimentar.
              </span>
            </label>
            <Note>
              Nesses casos e para menores de 18 anos, o diário continua
              disponível, mas não geramos metas de calorias ou dieta. Alergias e
              restrições clínicas precisam de revisão profissional.
            </Note>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {step === 1 ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setStep(0);
                setError("");
              }}
            >
              Voltar
            </button>
          ) : (
            <span className="muted small">
              Seus dados ficam neste navegador.
            </span>
          )}
          <button className="button" type="submit">
            {step === 0 ? "Continuar" : "Salvar meu perfil"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
