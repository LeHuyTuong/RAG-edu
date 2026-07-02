import type { FC, ReactNode } from "react";

export const DocumentCarousel: FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`${className}`}>
      <div
        className="
          -mx-4
          flex
          gap-4
          overflow-x-auto
          scroll-smooth
          px-4
          pb-2
          pt-1
          snap-x
          snap-mandatory

          [&::-webkit-scrollbar]:hidden
          [scrollbar-width:none]
        "
      >
        {children}

        <div className="w-4 shrink-0" />
      </div>
    </div>
  );
};
