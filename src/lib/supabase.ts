import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only the public project key belongs in this bundle. Never use a service role key.
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function authMessage(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos. Confira e tente novamente.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar. Confira também a pasta de spam.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "weak_password":
      return "Escolha uma senha mais forte, com pelo menos 8 caracteres.";
    case "otp_expired":
      return "Este link expirou ou já foi usado. Solicite um novo link.";
    default:
      return "Não foi possível concluir. Verifique sua conexão e tente novamente.";
  }
}
