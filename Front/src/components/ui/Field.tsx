import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        style={{
          width: "100%",
          height: 42,
          padding: "0 12px",
          borderRadius: 10,
          border: "1.5px solid var(--line)",
          outline: 0,
          fontSize: 14,
          background: "var(--paper)",
          ...props.style,
        }}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    return (
      <select
        ref={ref}
        {...props}
        style={{
          width: "100%",
          height: 42,
          padding: "0 12px",
          borderRadius: 10,
          border: "1.5px solid var(--line)",
          outline: 0,
          fontSize: 14,
          background: "var(--paper)",
          ...props.style,
        }}
      />
    );
  }
);

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--ink-700)" }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 12, color: "var(--bad-700)", marginTop: 5 }}>{error}</div>}
    </div>
  );
}
