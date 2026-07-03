import type { CSSProperties } from "react";
import { IconChevronL, IconChevronR } from "../Icons";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, pageSize, total, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
      <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
        {desde}–{hasta} de {total}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} style={pgBtn(page <= 1)}>
          <IconChevronL size={16} />
        </button>
        <span className="mono" style={{ fontSize: 13, color: "var(--ink-700)" }}>
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} style={pgBtn(page >= totalPages)}>
          <IconChevronR size={16} />
        </button>
      </div>
    </div>
  );
}

function pgBtn(disabled: boolean): CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "var(--paper)",
    display: "grid",
    placeItems: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
