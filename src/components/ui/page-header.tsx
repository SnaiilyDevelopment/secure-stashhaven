
import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageHeader({
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <section
      className={cn("grid gap-1", className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function PageHeaderHeading({
  className,
  children,
  ...props
}: PageHeaderHeadingProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-bold tracking-tight md:text-4xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function PageHeaderDescription({
  className,
  children,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
