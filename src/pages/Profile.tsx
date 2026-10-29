import { useState } from "react";
import {
  ArrowUpRight,
  Download,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { emptyState, useHealth } from "../store";
import { activityLevels, goalNames } from "../lib/health";
import { Modal, Note, number } from "../components/ui";

export function Profile({ onEdit }: { onEdit: () => void }) {
  const { state, reset, notify, exportJson } = useHealth();
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
        <h2>Seus dados ficam com você.</h2>
        <p>
          Esta primeira versão salva suas informações apenas neste navegador.
          Não há conta, sincronização com outros dispositivos ou envio dos
          registros a um servidor. Limpar os dados do navegador também remove
          seus registros.
        </p>
        <p>
          A exportação contém informações pessoais e de saúde. Guarde-a com
          cuidado, especialmente em um dispositivo compartilhado.
        </p>
        <div className="privacy-actions">
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
        Um futuro cadastro com login e sincronização precisará de armazenamento
        seguro, consentimento e controles de acesso. A versão atual é pessoal e
        local.
      </Note>
      {confirm && (
        <Modal
          title="Excluir seus dados deste navegador?"
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
