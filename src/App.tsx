import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Heart,
  LayoutDashboard,
  Leaf,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  Sprout,
  UserRound,
  X,
} from "lucide-react";
import { HealthProvider, useHealth } from "./store";
import type { Food, MealName } from "./lib/types";
import { dateKey } from "./lib/health";
import { ProfileForm } from "./components/ProfileForm";
import { FoodModal } from "./components/FoodModal";
import { Modal } from "./components/ui";
import { Overview } from "./pages/Overview";
import { Diary } from "./pages/Diary";
import { Foods } from "./pages/Foods";
import { Plan } from "./pages/Plan";
import { Workouts } from "./pages/Workouts";
import { Profile } from "./pages/Profile";

const navigation = [
  { key: "overview", title: "Visão geral", icon: LayoutDashboard },
  { key: "plan", title: "Meu plano", icon: ClipboardList },
  { key: "diary", title: "Diário alimentar", icon: BookOpen },
  { key: "foods", title: "Alimentos", icon: Sprout },
  { key: "workouts", title: "Meus treinos", icon: Dumbbell },
];
function Shell() {
  const { state, notice, storageError } = useHealth();
  const [page, setPage] = useState("overview");
  const [mobile, setMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [today, setToday] = useState(dateKey());
  const [date, setDate] = useState(dateKey());
  const [adding, setAdding] = useState<{ meal?: MealName; food?: Food } | null>(
    null,
  );
  useEffect(() => {
    const id = setInterval(() => setToday(dateKey()), 30000);
    return () => clearInterval(id);
  }, []);
  const activeDate = page === "diary" ? date : today;
  const navigate = (next: string) => {
    setPage(next);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const onAdd = (meal?: MealName) => setAdding({ meal });
  const onFood = (food: Food) => setAdding({ food });
  const current = navigation.find((n) => n.key === page);
  const fullDate = new Date(`${today}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside id="main-sidebar" className={`sidebar ${mobile ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
          aria-label="Health Control, início"
        >
          <span className="brand-mark">
            <Leaf size={24} />
          </span>
          <span>
            health<span className="brand-light">control</span>
            <small>VIVA BEM. NO SEU RITMO.</small>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Fechar navegação"
        >
          <X size={22} />
        </button>
        <div className="sidebar-label">SEU ESPAÇO DE CUIDADO</div>
        <nav aria-label="Navegação principal">
          {navigation.map(({ key, title, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`nav-item ${page === key ? "active" : ""}`}
              aria-current={page === key ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{title}</span>
              {page === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-quote">
          <span className="quote-spark">✳</span>
          <p>
            Uma vida mais leve
            <br />
            começa com <em>cuidado.</em>
          </p>
          <span>Você está no caminho.</span>
          <Leaf className="quote-leaf" size={76} strokeWidth={0.7} />
        </div>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === "profile" ? "active" : ""}`}
            onClick={() => navigate("profile")}
          >
            <Settings2 size={19} />
            <span>Meu perfil e dados</span>
          </button>
          <button className="profile-link" onClick={() => navigate("profile")}>
            <span className="avatar">
              {state.profile ? (
                state.profile.name[0].toUpperCase()
              ) : (
                <UserRound size={19} />
              )}
            </span>
            <span>
              <strong>{state.profile?.name ?? "Seu espaço pessoal"}</strong>
              <small>{state.profile ? "Meu perfil" : "Vamos começar?"}</small>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Abrir menu"
              aria-controls="main-sidebar"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={23} />
            </button>
            <span className="breadcrumb">
              Meu bem-estar
              <ChevronRight size={13} />
              <strong>{current?.title ?? "Meu perfil"}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <ShieldCheck size={15} />
              Seu espaço pessoal
            </span>
            <button
              className="topbar-avatar"
              onClick={() => navigate("profile")}
              aria-label="Abrir meu perfil"
            >
              {state.profile?.name[0].toUpperCase() ?? <UserRound size={17} />}
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">CUIDAR DE VOCÊ É UM BOM COMEÇO</span>
              <h1>
                {page === "overview"
                  ? state.profile
                    ? `Olá, ${state.profile.name.split(" ")[0]}. Que bom ter você aqui!`
                    : "Seu bem-estar, todos os dias."
                  : (current?.title ?? "Meu perfil")}
              </h1>
              <p>
                {page === "overview"
                  ? "Alimentação, movimento e equilíbrio. Um passo de cada vez."
                  : "Mais consciência para cuidar da sua rotina."}
              </p>
            </div>
            <div className="heading-actions">
              <span className="date-label">
                <CalendarDays size={16} />
                {fullDate}
              </span>
              <button className="button" onClick={() => onAdd()}>
                <Plus size={17} />
                <span>Registrar alimento</span>
              </button>
            </div>
          </div>
          {storageError && (
            <div className="storage-error" role="alert">
              {storageError}
            </div>
          )}
          {page === "overview" && (
            <Overview
              date={today}
              onProfile={() => setProfileOpen(true)}
              onAdd={onAdd}
              navigate={navigate}
            />
          )}
          {page === "diary" && (
            <Diary date={date} setDate={setDate} onAdd={onAdd} />
          )}
          {page === "foods" && <Foods onAdd={onFood} />}
          {page === "plan" && (
            <Plan
              date={today}
              onProfile={() => setProfileOpen(true)}
              onFood={onFood}
            />
          )}
          {page === "workouts" && <Workouts />}
          {page === "profile" && (
            <Profile onEdit={() => setProfileOpen(true)} />
          )}
          <footer className="page-footer">
            <span>
              <Heart size={13} />
              Feito para uma rotina com mais cuidado.
            </span>
            <button onClick={() => setSourcesOpen(true)}>
              Sobre os cálculos e dados
              <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      {profileOpen && <ProfileForm onClose={() => setProfileOpen(false)} />}{" "}
      {adding && (
        <FoodModal
          date={activeDate}
          initialMeal={adding.meal}
          initialFood={adding.food}
          onClose={() => setAdding(null)}
        />
      )}
      {sourcesOpen && (
        <Modal
          title="Informação que cuida"
          subtitle="Transparência sobre as estimativas e os dados."
          onClose={() => setSourcesOpen(false)}
        >
          <div className="form-content sources-content">
            <h3>Metabolismo e energia</h3>
            <p>
              Usamos Mifflin–St Jeor (1990) para estimar o metabolismo basal e
              fatores de atividade para estimar o gasto diário. Frequência,
              intensidade e movimento cotidiano variam: os resultados não
              substituem avaliação.
            </p>
            <h3>Composição dos alimentos</h3>
            <p>
              TACO, NEPA/UNICAMP, 4ª edição (2011), com 597 alimentos.
              Digitalização pelo projeto{" "}
              <a
                href="https://github.com/raulfdm/taco-api"
                target="_blank"
                rel="noreferrer"
              >
                taco-api
              </a>{" "}
              (MIT). Valores por 100 g de parte comestível. A digitalização é
              distribuída sob licença MIT; a atribuição foi preservada no
              projeto.
            </p>
            <p>
              N/D significa dado ausente; totais incompletos são sinalizados.
              Traços foram arredondados a zero pela digitalização. A base não
              tem todas as vitaminas e minerais. RE, RAE e retinol não devem ser
              somados.
            </p>
            <h3>Um apoio para sua rotina</h3>
            <p>
              As sugestões de alimentação e treino são educativas. Não fazemos
              diagnóstico ou prescrição clínica. Restrições, condições de saúde
              e objetivos individuais pedem acompanhamento qualificado.
            </p>
          </div>
          <div className="modal-actions">
            <span />
            <button className="button" onClick={() => setSourcesOpen(false)}>
              Entendi
              <CheckCircle2 size={16} />
            </button>
          </div>
        </Modal>
      )}
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <CheckCircle2 size={19} />
            <span>{notice}</span>
          </>
        )}
      </div>
    </div>
  );
}
export default function App() {
  return (
    <HealthProvider>
      <Shell />
    </HealthProvider>
  );
}
