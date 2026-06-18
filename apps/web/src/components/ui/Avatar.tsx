import type { FC } from "react";
import { isDefaultAvatar } from "@/shared/constants";

export interface AvatarProps {
  readonly imageUrl?: string;
  readonly initials?: string;
  readonly size?: "sm" | "md" | "lg";
  readonly tone?: "primary" | "secondary" | "tertiary";
  readonly className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-lg",
};

const toneClasses: Record<NonNullable<AvatarProps["tone"]>, string> = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
};

export const Avatar: FC<AvatarProps> = ({
  imageUrl,
  initials,
  size = "md",
  tone = "primary",
  className = "",
}) => {
  if (imageUrl && !isDefaultAvatar(imageUrl)) {
    return (
      <img
        src={imageUrl}
        alt="Avatar"
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
};
