import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Utensils,
} from "lucide-react";
import { authMessage, supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

type Mode = "login" | "signup" | "forgot";
export function AuthPage({ onBack }: { onBack?: () => void }) {
  const { recovery, finishRecovery } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const changeMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setError("");
    setMessage("");
    if ((mode === "signup" || recovery) && password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      const redirect = window.location.origin + window.location.pathname;
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setError(authMessage(error.code));
          return;
        }
        setPassword("");
        setConfirmation("");
        finishRecovery();
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) setError(authMessage(error.code));
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirect,
            data: {
              display_name: name.trim(),
              health_data_consent_at: new Date().toISOString(),
              health_data_consent_version: 1,
            },
          },
        });
        if (error) {
          setError(authMessage(error.code));
          return;
        }
        setPassword("");
        setConfirmation("");
        if (!data.session)
          setMessage(
            "Confira seu e-mail para confirmar o cadastro. Depois, volte aqui para entrar. Se já possui conta, use Entrar ou recupere sua senha.",
          );
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: redirect },
        );
        if (error) {
          setError(authMessage(error.code));
          return;
        }
        setMessage(
          "Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha. Confira também a pasta de spam.",
        );
      }
    } catch {
      setError(authMessage());
    } finally {
      setBusy(false);
    }
  }
  const signup = mode === "signup" && !recovery;
  const forgot = mode === "forgot" && !recovery;
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Health Control">
        <a href="#" className="brand" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">
            <Leaf size={24} />
          </span>
          <span>
            health<span className="brand-light">control</span>
            <small>VIVA BEM. NO SEU RITMO.</small>
          </span>
        </a>
        <div className="auth-story-content">
          <span className="eyebrow">UM ESPAÇO PARA CUIDAR DE VOCÊ</span>
          <h2>
            Pequenos hábitos.
            <br />
            <em>Uma vida mais leve.</em>
          </h2>
          <p>
            Sua alimentação, seus treinos e sua hidratação juntos, no seu ritmo.
          </p>
          <div className="auth-benefits">
            <span>
              <Utensils size={19} /> Alimentação com mais consciência
            </span>
            <span>
              <Dumbbell size={19} /> Movimento que cabe na sua rotina
            </span>
            <span>
              <Droplets size={19} /> Cuidado em cada copo de água
            </span>
          </div>
        </div>
        <p className="auth-story-footer">
          Seu próximo passo começa com cuidado.
        </p>
        <Leaf
          className="auth-decoration"
          size={320}
          strokeWidth={0.5}
          aria-hidden="true"
        />
      </section>
      <section className="auth-main">
        <div className="auth-card">
          {(onBack || forgot) && !recovery && (
            <button
              className="auth-back"
              onClick={() => (forgot ? changeMode("login") : onBack?.())}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}
          <span className="round-icon">
            <LockKeyhole size={23} />
          </span>
          <h1>
            {recovery
              ? "Crie sua nova senha."
              : signup
                ? "Seu cuidado começa aqui."
                : forgot
                  ? "Vamos recuperar seu acesso."
                  : "Que bom ter você aqui."}
          </h1>
          <p className="auth-subtitle">
            {recovery
              ? "Escolha uma senha para continuar cuidando da sua rotina."
              : signup
                ? "Crie sua conta e organize sua rotina em um só lugar."
                : forgot
                  ? "Enviaremos um link para o e-mail da sua conta."
                  : "Entre na sua conta para continuar de onde parou."}
          </p>
          {!recovery && !forgot && (
            <div className="auth-tabs" aria-label="Acesso à conta">
              <button
                aria-pressed={!signup}
                onClick={() => changeMode("login")}
                disabled={busy}
              >
                Entrar
              </button>
              <button
                aria-pressed={signup}
                onClick={() => changeMode("signup")}
                disabled={busy}
              >
                Criar conta
              </button>
            </div>
          )}
          {!supabase && (
            <p className="auth-info" role="status">
              O acesso por conta está sendo preparado. Por enquanto, você pode
              voltar e usar os registros deste navegador.
            </p>
          )}
          <form onSubmit={submit} className="auth-form">
            {signup && (
              <label>
                Seu nome
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="Como podemos chamar você?"
                />
              </label>
            )}
            {!recovery && (
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                  placeholder="voce@exemplo.com"
                />
              </label>
            )}
            {!forgot && (
              <label>
                {recovery ? "Nova senha" : "Senha"}
                <span className="password-field">
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={
                      signup || recovery ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={signup || recovery ? 8 : 1}
                    maxLength={128}
                    aria-describedby={
                      signup || recovery ? "password-help" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </label>
            )}
            {(signup || recovery) && (
              <>
                <p className="small muted" id="password-help">
                  Use pelo menos 8 caracteres. Prefira uma senha longa e
                  exclusiva.
                </p>
                <label>
                  Confirmar senha
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </label>
              </>
            )}
            {!signup && !forgot && !recovery && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => changeMode("forgot")}
              >
                Esqueci minha senha
              </button>
            )}
            {signup && (
              <label className="auth-consent">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Concordo em armazenar meu perfil e meus registros de
                  alimentação, água e treinos na minha conta para usar o Health
                  Control. Posso exportar ou excluir esses registros em Meu
                  perfil.
                </span>
              </label>
            )}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="auth-info" role="status">
                <CheckCircle2 size={18} /> {message}
              </p>
            )}
            <button
              className="button auth-submit"
              disabled={busy || !supabase}
              type="submit"
            >
              {busy
                ? "Aguarde…"
                : recovery
                  ? "Salvar nova senha"
                  : signup
                    ? "Criar minha conta"
                    : forgot
                      ? "Enviar link de recuperação"
                      : "Entrar na minha conta"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-privacy">
            <LockKeyhole size={13} /> Seus registros são vinculados à sua conta
            e protegidos por controles de acesso. As recomendações são
            educativas.
          </p>
        </div>
      </section>
    </main>
  );
}
