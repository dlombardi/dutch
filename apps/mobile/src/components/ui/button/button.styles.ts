import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "items-center justify-center flex-row rounded-xl",
  {
    variants: {
      size: {
        sm: "py-2 px-4",
        md: "py-3 px-4",
        lg: "py-4 px-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export const textVariants = cva("font-semibold", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ButtonStyleVariants = VariantProps<typeof buttonVariants>;
