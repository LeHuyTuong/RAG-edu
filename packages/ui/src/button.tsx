"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "style"
> {
  children: ReactNode;
  className?: string;
  appName?: string;
}

export const Button = ({
  children,
  className,
  appName,
  ...props
}: ButtonProps) => {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};
