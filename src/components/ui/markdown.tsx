import type { ReactNode } from "react";

export const Markdown: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="whitespace-pre-wrap text-sm leading-7">{children}</div>
);
