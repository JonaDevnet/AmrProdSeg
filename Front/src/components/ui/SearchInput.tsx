import { IconSearch } from "../Icons";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 42,
        padding: "0 14px",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        maxWidth: 380,
        width: "100%",
      }}
    >
      <IconSearch size={17} style={{ color: "var(--ink-400)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Buscar…"}
        style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14 }}
      />
    </div>
  );
}
