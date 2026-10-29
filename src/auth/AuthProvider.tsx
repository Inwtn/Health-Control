import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  error: boolean;
  recovery: boolean;
  finishRecovery: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState(false);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    let eventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (!alive) return;
      eventReceived = true;
      setSession(next);
      setLoading(false);
      setError(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive || eventReceived) return;
        setSession(data.session);
        setError(Boolean(error));
        setLoading(false);
      })
      .catch(() => {
        if (alive && !eventReceived) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        recovery,
        finishRecovery: () => setRecovery(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider ausente");
  return context;
}
