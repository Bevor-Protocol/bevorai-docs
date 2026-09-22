import type { ReactNode } from "react";

export const InlineTag = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-fd-muted-foreground py-2">
    <span>{label}:</span>
    <code className="rounded bg-fd-secondary px-1 py-0.5 font-mono text-fd-foreground">
      {children}
    </code>
  </span>
);

export const MatchTag = ({ value }: { value: string }) => (
  <InlineTag label="Match">{value}</InlineTag>
);
export const MultipleOfTag = ({ value }: { value: number }) => (
  <InlineTag label="Multiple of">{value}</InlineTag>
);
export const RangeTag = ({ value }: { value: string }) => (
  <InlineTag label="Range">{value}</InlineTag>
);
export const LengthTag = ({ value }: { value: string }) => (
  <InlineTag label="Length">{value}</InlineTag>
);
export const ItemsRangeTag = ({ value }: { value: string }) => (
  <InlineTag label="Items">{value}</InlineTag>
);
export const DefaultTag = ({ value }: { value: string }) => (
  <InlineTag label="Default">{value}</InlineTag>
);

export const EnumTag = ({ values }: { values: string[] }) => (
  <div className="mt-1.5 flex w-full flex-wrap items-baseline gap-x-1 gap-y-1 text-xs">
    <span className="mr-1 text-fd-muted-foreground">Available options:</span>
    {values.map((value, i) => (
      <span key={value} className="whitespace-nowrap">
        <code className="rounded bg-fd-secondary px-1 py-0.5 font-mono text-[11px] text-fd-foreground">
          {value}
        </code>
        {i < values.length - 1 && <span className="text-fd-muted-foreground">,</span>}
      </span>
    ))}
  </div>
);
