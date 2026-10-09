import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonStyleProps = {
  variant?: "primary" | "secondary" | "text";
  size?: "md" | "sm" | "icon";
  className?: string;
};

export function buttonClasses({ variant = "primary", size = "md", className }: ButtonStyleProps = {}) {
  return ["button", `button-${variant}`, `button-${size}`, className].filter(Boolean).join(" ");
}

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & ButtonStyleProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, href, reloadDocument = false, ...props }: ComponentProps<"a"> & ButtonStyleProps & {
  href: string;
  reloadDocument?: boolean;
}) {
  const classes = buttonClasses({ variant, size, className });
  // Retry links need a full request, while normal navigation keeps Next.js routing.
  return reloadDocument
    ? <a href={href} className={classes} {...props} />
    : <Link href={href} className={classes} {...props} />;
}
