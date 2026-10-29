import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import rawFoods from "./data/foods.json";
import type { AppState, Food } from "./lib/types";
import { validateProfile } from "./lib/health";
import { supabase } from "./lib/supabase";
import { useAuth } from "./auth/AuthProvider";

export const foods = rawFoods as Food[];
export const emptyState = (): AppState => ({
  version: 1,
  profile: null,
  training: null,
  entries: [],
  water: [],
  waterGoal: 2000,
  completed: {},
});
const KEY = "health-control:v1";
export function parseState(value: unknown): AppState {
  const p = value as AppState;
  if (!p || typeof p !== "object") throw new Error("invalid");
  if (
    p.version !== 1 ||
    !Array.isArray(p.entries) ||
    !Array.isArray(p.water) ||
    !Number.isFinite(p.waterGoal) ||
    p.waterGoal < 250 ||
    p.waterGoal > 8000 ||
    (p.profile && validateProfile(p.profile))
  )
    throw new Error("invalid");
  const validDate = (d: string) =>
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (
    p.entries.some(
      (e) =>
        !validDate(e.date) ||
        !foods.some((f) => f.id === e.foodId) ||
        !Number.isFinite(e.grams) ||
        e.grams <= 0 ||
        e.grams > 3000 ||
        !["Café da manhã", "Almoço", "Lanche", "Jantar"].includes(e.meal),
    ) ||
    p.water.some(
      (e) =>
        !validDate(e.date) ||
        !Number.isFinite(e.ml) ||
        e.ml <= 0 ||
        e.ml > 3000,
    )
  )
    throw new Error("invalid");
  if (
    p.training &&
    (![2, 3, 4, 5, 6].includes(p.training.days) ||
      ![30, 45, 60].includes(p.training.minutes) ||
      !["beginner", "intermediate"].includes(p.training.experience) ||
      !["gym", "home"].includes(p.training.equipment) ||
      !["strength", "conditioning"].includes(p.training.goal))
  )
    throw new Error("invalid");
  if (
    !p.completed ||
    typeof p.completed !== "object" ||
    Array.isArray(p.completed) ||
    Object.values(p.completed).some((v) => typeof v !== "boolean")
  )
    throw new Error("invalid");
  return { ...emptyState(), ...p };
}
function load(): { data: AppState; error: string; backup: string | null } {
  let backup: string | null = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return { data: emptyState(), error: "", backup: null };
    backup = saved;
    const p = parseState(JSON.parse(saved));
    return { data: { ...emptyState(), ...p }, error: "", backup: null };
  } catch {
    return {
      data: emptyState(),
      error:
        "Não foi possível recuperar os dados salvos. Não sobrescrevemos o conteúdo anterior; o salvamento está pausado. Exporte uma cópia ou exclua os dados em Meu perfil para recomeçar.",
      backup,
    };
  }
}
type Context = {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  notify: (message: string) => void;
  notice: string;
  storageError: string;
  reset: () => void;
  exportJson: () => string;
  syncStatus?: string;
  retrySave?: () => void;
  unsaved?: boolean;
  importLegacy?: () => void;
};
const HealthContext = createContext<Context | null>(null);
function LocalHealthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [notice, notify] = useState("");
  const [paused, setPaused] = useState(Boolean(initial.error));
  const [backup, setBackup] = useState(initial.backup);
  useEffect(() => {
    if (paused) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError("");
    } catch {
      setStorageError(
        "O navegador não conseguiu salvar os dados. Exporte uma cópia em Meu perfil antes de sair.",
      );
    }
  }, [state, paused]);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => notify(""), 4500);
      return () => clearTimeout(id);
    }
  }, [notice]);
  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      notify(
        "Não foi possível excluir o armazenamento. Verifique as permissões do navegador.",
      );
      return;
    }
    setState(emptyState());
    setBackup(null);
    setPaused(false);
    setStorageError("");
    notify("Dados deste navegador excluídos.");
  };
  const exportJson = () =>
    paused && backup ? backup : JSON.stringify(state, null, 2);
  return (
    <HealthContext.Provider
      value={{
        state,
        setState,
        notify,
        notice,
        storageError,
        reset,
        exportJson,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}
export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) throw new Error("Provider ausente");
  return context;
}

function CloudHealthProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [state, setState] = useState<AppState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [notice, notify] = useState("");
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const [backup, setBackup] = useState<string | null>(null);
  const revision = useRef<number | null>(null);
  const saved = useRef("");
  const inFlight = useRef(false);
  const alive = useRef(false);
  const current = JSON.stringify(state);
  const unsaved = loaded && current !== saved.current;
  useEffect(() => {
    alive.current = true;
    let active = true;
    supabase!
      .from("health_records")
      .select("data,revision")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError(true);
          return;
        }
        revision.current = data?.revision ?? null;
        try {
          const initial = data ? parseState(data.data) : emptyState();
          saved.current = JSON.stringify(initial);
          setState(initial);
          setLoaded(true);
        } catch {
          setBackup(JSON.stringify(data?.data, null, 2));
          setStorageError(
            "Não foi possível recuperar os dados da conta. O salvamento está pausado. Exporte uma cópia em Meu perfil antes de excluir os registros para recomeçar.",
          );
          setConflict(true);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
      alive.current = false;
    };
  }, [userId]);
  useEffect(() => {
    if (!loaded || !unsaved || storageError || inFlight.current) return;
    const timer = setTimeout(async () => {
      if (!alive.current || inFlight.current) return;
      inFlight.current = true;
      setSaving(true);
      try {
        const row = { user_id: userId, data: state };
        const result =
          revision.current === null
            ? await supabase!
                .from("health_records")
                .insert(row)
                .select("revision")
                .maybeSingle()
            : await supabase!
                .from("health_records")
                .update({ data: state })
                .eq("user_id", userId)
                .eq("revision", revision.current)
                .select("revision")
                .maybeSingle();
        if (!alive.current) return;
        if (result.error || !result.data) {
          const collision = !result.error || result.error.code === "23505";
          setConflict(collision);
          setStorageError(
            collision
              ? "Os registros foram alterados em outra aba ou dispositivo. Exporte uma cópia das alterações e recarregue a página antes de continuar. Suas alterações não foram enviadas."
              : "Não foi possível salvar na sua conta. Suas alterações estão nesta tela; mantenha-a aberta e tente novamente. Você também pode exportar uma cópia em Meu perfil.",
          );
        } else {
          revision.current = result.data.revision;
          saved.current = current;
        }
      } catch {
        if (alive.current)
          setStorageError(
            "Sem conexão para salvar. Mantenha esta página aberta e tente novamente ou exporte seus dados.",
          );
      } finally {
        inFlight.current = false;
        if (alive.current) {
          setSaving(false);
          setTick((v) => v + 1);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state, current, loaded, unsaved, storageError, tick, userId]);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  if (loadError)
    return (
      <main className="auth-loading">
        <h1>Não foi possível carregar sua conta.</h1>
        <p>
          Verifique a conexão e tente novamente. Seus registros não foram
          substituídos.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
        <button
          className="button secondary"
          onClick={() => void supabase!.auth.signOut()}
        >
          Sair da conta
        </button>
      </main>
    );
  if (!loaded)
    return (
      <main className="auth-loading" role="status">
        Carregando seus registros…
      </main>
    );
  return (
    <HealthContext.Provider
      value={{
        state,
        setState,
        notice,
        notify,
        storageError,
        syncStatus: storageError
          ? "Salvamento pendente"
          : saving || unsaved
            ? "Salvando alterações…"
            : "Salvo na sua conta",
        unsaved,
        retrySave:
          storageError && !conflict ? () => setStorageError("") : undefined,
        exportJson: () => backup ?? JSON.stringify(state, null, 2),
        reset: () => {
          setBackup(null);
          setConflict(false);
          setStorageError("");
          setState(emptyState());
          notify(
            "Registros removidos da tela. Aguarde a confirmação de salvamento na conta.",
          );
        },
        importLegacy: () => {
          try {
            const raw = localStorage.getItem(KEY);
            if (!raw) {
              notify("Não há registros da versão anterior neste navegador.");
              return;
            }
            if (current !== JSON.stringify(emptyState())) {
              notify(
                "A importação só está disponível quando a conta não possui registros. Exporte seus dados atuais antes de continuar.",
              );
              return;
            }
            setState(parseState(JSON.parse(raw)));
            notify(
              "Registros importados. Aguarde o salvamento na conta. A cópia antiga foi preservada neste navegador.",
            );
          } catch {
            notify(
              "Os registros antigos não puderam ser lidos. A cópia original foi preservada.",
            );
          }
        },
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return session && supabase ? (
    <CloudHealthProvider key={session.user.id} userId={session.user.id}>
      {children}
    </CloudHealthProvider>
  ) : (
    <LocalHealthProvider>{children}</LocalHealthProvider>
  );
}
