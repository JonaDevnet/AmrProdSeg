import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base: CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "1px solid transparent",
  transition: "all .15s ease",
};

const variants: Record<Variant, CSSProperties> = {
  primary: { background: "var(--navy-900)", color: "white" },
  secondary: { background: "var(--paper)", color: "var(--ink-900)", border: "1px solid var(--line)" },
  ghost: { background: "transparent", color: "var(--ink-700)" },
  danger: { background: "var(--bad-600)", color: "white" },
};

export default function Button({ variant = "primary", style, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    />
  );
}
