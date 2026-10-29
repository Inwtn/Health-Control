import { useState } from "react";
import {
  ArrowUpRight,
  Download,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { emptyState, useHealth } from "../store";
import { activityLevels, goalNames } from "../lib/health";
import { Modal, Note, number } from "../components/ui";

export function Profile({ onEdit }: { onEdit: () => void }) {
  const { state, reset, notify, exportJson, importLegacy } = useHealth();
  const { session } = useAuth();
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const p = state.profile;
  function exportData() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "health-control-meus-dados.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Cópia dos dados exportada. Guarde o arquivo em um lugar seguro.");
  }
  return (
    <>
      <div className="page-toolbar">
        <div>
          <h2>Seu espaço, suas escolhas.</h2>
          <p>Mantenha suas informações em dia e cuide dos seus dados.</p>
        </div>
      </div>
      <section className="card profile-card">
        <span className="profile-avatar">
          {p ? p.name.slice(0, 1).toUpperCase() : <UserRound size={32} />}
        </span>
        <div>
          <h2>{p?.name ?? "Vamos nos conhecer?"}</h2>
          <p>
            {p
              ? `${p.age} anos · ${goalNames[p.goal]}`
              : "Crie seu perfil para receber estimativas e organizar sua rotina."}
          </p>
        </div>
        <button className="button secondary" onClick={onEdit}>
          {p ? "Editar perfil" : "Criar perfil"}
          <ArrowUpRight size={16} />
        </button>
      </section>
      {p && (
        <section className="card">
          <div className="profile-facts">
            {[
              ["Peso atual", `${number(p.weight, 1)} kg`],
              ["Altura", `${number(p.height, 1)} cm`],
              ["Rotina", activityLevels[p.activity].label],
              [
                "Alimentação",
                p.diet === "all"
                  ? "Variada"
                  : p.diet === "vegan"
                    ? "Vegana"
                    : "Vegetariana",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="card privacy-card">
        <span className="round-icon">
          <ShieldCheck size={25} />
        </span>
        <h2>
          {session
            ? "Sua conta, seus registros."
            : "Seus dados ficam com você."}
        </h2>
        <p>
          {session ? (
            <>
              Você está conectado como{" "}
              <strong className="account-email">{session.user.email}</strong>.
              Seu perfil, alimentação, água e treinos são armazenados no
              Supabase e vinculados à sua conta. Aguarde a indicação de
              salvamento antes de fechar a página. Em dispositivos
              compartilhados, saia da conta quando terminar.
            </>
          ) : (
            "Suas informações são salvas apenas neste navegador. Limpar os dados do navegador remove esses registros. O acesso por conta será disponibilizado quando a conexão estiver pronta."
          )}
        </p>
        <p>
          A exportação contém informações pessoais e de saúde. Guarde-a com
          cuidado, especialmente em um dispositivo compartilhado.
        </p>
        <div className="privacy-actions">
          {importLegacy && (
            <button
              className="button secondary"
              onClick={() => setConfirmImport(true)}
            >
              Importar registros da versão anterior
            </button>
          )}
          <button className="button secondary" onClick={exportData}>
            <Download size={17} />
            Exportar meus dados
          </button>
          <button
            className="button danger-button"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={17} />
            Excluir meus dados
          </button>
        </div>
      </section>
      <Note>
        <LockKeyhole size={15} />
        {session
          ? "Excluir os registros remove seu perfil e seu histórico de saúde da conta após o salvamento. Seu acesso por e-mail e senha é mantido. A exportação inclui os registros de saúde, sem a senha."
          : "Os registros locais não são enviados automaticamente a uma conta. Você poderá escolher importá-los após entrar."}
      </Note>
      {confirmImport && (
        <Modal
          title="Importar registros deste navegador?"
          subtitle="Faça isso somente se os registros da versão anterior são seus."
          onClose={() => setConfirmImport(false)}
        >
          <div className="form-content">
            <p>
              Os registros locais serão copiados para a conta{" "}
              {session?.user.email}. A importação requer uma conta sem registros
              e preserva a cópia antiga neste navegador.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmImport(false)}
            >
              Cancelar
            </button>
            <button
              className="button"
              onClick={() => {
                importLegacy?.();
                setConfirmImport(false);
              }}
            >
              Importar meus registros
            </button>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            session
              ? "Excluir seus registros da conta?"
              : "Excluir seus dados deste navegador?"
          }
          subtitle="Esta ação não pode ser desfeita."
          onClose={() => setConfirm(false)}
        >
          <div className="form-content">
            <p>
              Seu perfil, refeições, registros de água e treinos serão
              removidos. Você pode exportar uma cópia antes de continuar.
            </p>
            <p className="muted small">
              Uma nova sessão começará com a meta de água de{" "}
              {number(emptyState().waterGoal)} ml.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Cancelar
            </button>
            <button
              className="button danger-button"
              onClick={() => {
                reset();
                setConfirm(false);
              }}
            >
              Excluir definitivamente
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
