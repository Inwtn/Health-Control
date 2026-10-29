import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import rawFoods from "./data/foods.json";
import type { AppState, Food } from "./lib/types";
import { validateProfile } from "./lib/health";

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
function load(): { data: AppState; error: string; backup: string | null } {
  let backup: string | null = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return { data: emptyState(), error: "", backup: null };
    backup = saved;
    const p = JSON.parse(saved) as AppState;
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
};
const HealthContext = createContext<Context | null>(null);
export function HealthProvider({ children }: { children: ReactNode }) {
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
