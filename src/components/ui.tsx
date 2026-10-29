import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Info, X } from "lucide-react";
import { dateKey, shiftDate } from "../lib/health";

export const number = (value: number, decimals = 0) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: decimals }).format(
    value,
  );
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const today = dateKey();
  return (
    <div className="date-picker">
      <button
        className="icon-button"
        aria-label="Dia anterior"
        onClick={() => onChange(shiftDate(value, -1))}
      >
        <ArrowLeft size={16} />
      </button>
      <label>
        <span>
          {value === today
            ? "Hoje"
            : new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
              })}
        </span>
        <input
          aria-label="Data do diário"
          type="date"
          value={value}
          max={today}
          onChange={(e) => {
            if (e.target.value && e.target.value <= today)
              onChange(e.target.value);
          }}
        />
      </label>
      <button
        className="icon-button"
        aria-label="Próximo dia"
        disabled={value >= today}
        onClick={() => onChange(shiftDate(value, 1))}
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <Info size={17} />
      <span>{children}</span>
    </div>
  );
}
export function Progress({
  value,
  goal,
  color = "green",
}: {
  value: number;
  goal: number | null;
  color?: string;
}) {
  const percentage =
    goal && goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  return (
    <div
      className={`progress ${color}`}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da meta"
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}
export function CheckTag({ children }: { children: ReactNode }) {
  return (
    <span className="check-tag">
      <Check size={13} />
      {children}
    </span>
  );
}
