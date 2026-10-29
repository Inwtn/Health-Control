import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Dumbbell,
  Leaf,
  Target,
  TrendingUp,
} from "lucide-react";
import { useHealth } from "../store";
import { calculatePlan, generateWorkouts, goalNames } from "../lib/health";
import type { MealName } from "../lib/types";
import { EnergyCard, MealList, Micronutrients } from "../components/Nutrition";
import { WaterCard } from "../components/WaterCard";
import { number, SectionTitle } from "../components/ui";
import plateIllustration from "../assets/plate.svg?inline";

export function Overview({
  date,
  onProfile,
  onAdd,
  navigate,
}: {
  date: string;
  onProfile: () => void;
  onAdd: (meal?: MealName) => void;
  navigate: (page: string) => void;
}) {
  const { state } = useHealth();
  const profile = state.profile;
  const plan = profile ? calculatePlan(profile) : null;
  const workouts = state.training ? generateWorkouts(state.training) : [];
  return (
    <>
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">
            <Leaf size={13} />
            BEM-ESTAR QUE CABE NA SUA ROTINA
          </span>
          <h2>
            {profile
              ? "Pequenos hábitos.\nGrandes mudanças."
              : "Seu próximo passo\ncomeça aqui."}
          </h2>
          <p>
            {profile
              ? "Alimente seu corpo, movimente sua vida e respeite seu ritmo."
              : "Conheça seu corpo e construa uma rotina mais leve, do seu jeito."}
          </p>
          <button
            className="banner-button"
            onClick={profile ? () => navigate("plan") : onProfile}
          >
            {profile ? "Ver meu plano" : "Criar meu plano"}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="banner-art">
          <span className="art-circle" />
          <img
            src={plateIllustration}
            alt="Ilustração de um prato colorido com vegetais, grãos e proteína"
          />
          <span className="art-label">
            <Check size={12} />
            Equilíbrio em cada escolha
          </span>
        </div>
      </section>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <EnergyCard date={date} />
          <section className="card meals-card">
            <SectionTitle title="Suas refeições">
              <button className="text-button" onClick={() => navigate("diary")}>
                Abrir diário
                <ArrowUpRight size={15} />
              </button>
            </SectionTitle>
            <MealList date={date} onAdd={onAdd} compact />
          </section>
          <section className="card workout-preview">
            <span className="round-icon peach">
              <Dumbbell size={24} />
            </span>
            <div>
              <span className="eyebrow">MOVIMENTO TAMBÉM É CUIDADO</span>
              <h3>
                {workouts.length
                  ? `${workouts.length} treinos, no seu ritmo`
                  : "Encontre o seu ritmo"}
              </h3>
              <p>
                {workouts.length
                  ? `${state.training!.minutes} minutos por sessão · ${state.training!.equipment === "gym" ? "Academia" : "Em casa"}`
                  : "Responda algumas perguntas e organize seus treinos."}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => navigate("workouts")}
            >
              {workouts.length ? "Ver treinos" : "Montar treino"}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
        <aside className="dashboard-side">
          <section className="card objective-card">
            <div className="card-heading">
              <span className="round-icon pale">
                <Target size={21} />
              </span>
              <h3>Seu objetivo</h3>
              {profile && (
                <button
                  className="icon-button"
                  aria-label="Editar perfil"
                  onClick={onProfile}
                >
                  <ArrowUpRight size={18} />
                </button>
              )}
            </div>
            <span className="objective-label">
              {profile ? goalNames[profile.goal] : "Uma rotina mais saudável"}
            </span>
            <p>
              {profile
                ? "Consistência vale mais que perfeição. Continue no seu ritmo."
                : "Cada pessoa tem um ponto de partida. Vamos descobrir o seu?"}
            </p>
            <div className="objective-values">
              <div>
                <span>{profile ? "Peso atual" : "Seu corpo"}</span>
                <strong>
                  {profile ? (
                    <>
                      {number(profile.weight, 1)}
                      <small> kg</small>
                    </>
                  ) : (
                    "Único"
                  )}
                </strong>
              </div>
              <span className="objective-arrow">
                <TrendingUp size={21} />
              </span>
              <div>
                <span>
                  {profile?.targetWeight
                    ? "Objetivo pessoal"
                    : "Seu compromisso"}
                </span>
                <strong>
                  {profile?.targetWeight ? (
                    <>
                      {number(profile.targetWeight, 1)}
                      <small> kg</small>
                    </>
                  ) : (
                    "Você"
                  )}
                </strong>
              </div>
            </div>
            <div className="objective-bottom">
              <CalendarDays size={15} />
              {plan?.calories
                ? "Um dia de cada vez, sem prazo rígido."
                : "Seu plano acompanha suas escolhas."}
            </div>
            {!profile && (
              <button className="text-button" onClick={onProfile}>
                Conhecer meu metabolismo
                <ArrowRight size={15} />
              </button>
            )}
          </section>
          <WaterCard date={date} />
          <Micronutrients date={date} onExpand={() => navigate("diary")} />
          <div className="gentle-reminder">
            <span>✦</span>
            <p>
              Não precisa ser perfeito.
              <br />
              <strong>Só precisa ser possível.</strong>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
