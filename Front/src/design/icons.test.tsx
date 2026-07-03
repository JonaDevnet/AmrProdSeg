import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IconCheck, Icon } from "./icons";

describe("icons (RTL)", () => {
  it("renderiza un <svg> con el tamaño indicado", () => {
    const { container } = render(<IconCheck size={20} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });

  it("Icon acepta un path string en la prop d", () => {
    const { container } = render(<Icon d="M5 12.5 10 17 19 7" />);
    expect(container.querySelector("svg path")).toBeInTheDocument();
  });
});
