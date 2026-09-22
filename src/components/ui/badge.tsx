import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { HTMLAttributes } from "react";

export const badgeVariants = cva(
  "inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      color: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        green:
          "border-green-600/20 bg-green-600/10 text-green-600 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-400",
        yellow:
          "border-yellow-600/20 bg-yellow-600/10 text-yellow-600 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-400",
        red: "border-red-600/20 bg-red-600/10 text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400",
        blue: "border-blue-600/20 bg-blue-600/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400",
        orange:
          "border-orange-600/20 bg-orange-600/10 text-orange-600 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-400",
      },
      size: {
        default: "px-2 py-0.5 text-sm rounded-sm",
        sm: "px-2 py-0.5 text-xs rounded-sm",
        sharp: "px-2 py-1 text-base rounded-xs",
        round: "px-2 py-1 text-sm rounded-lg",
        xs: "px-2 py-0.5 text-xs rounded-full",
        lg: "px-3 py-1 text-base rounded-sm",
      },
    },
    defaultVariants: {
      color: "default",
      size: "default",
    },
  },
);

export const getMethodColor = (method: string): VariantProps<typeof badgeVariants>["color"] => {
  switch (method.toUpperCase()) {
    case "PUT":
      return "yellow";
    case "PATCH":
      return "orange";
    case "POST":
      return "blue";
    case "DELETE":
      return "red";
    default:
      return "green";
  }
};

export function Badge({
  className,
  size,
  color,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "color"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ size, color }), className)} {...props} />;
}
