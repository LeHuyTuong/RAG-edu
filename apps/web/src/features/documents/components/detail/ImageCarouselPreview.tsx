"use client";

import Image from "next/image";

import { useState } from "react";

interface Props {
  readonly images: readonly string[];
}

export function ImageCarouselPreview({ images }: Props): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-outline-variant
        bg-surface
      "
    >
      {/* Toolbar */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-outline-variant
          px-4
          py-3
        "
      >
        <p className="text-sm font-medium">
          Trang {currentIndex + 1} / {images.length}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-surface-variant
              transition-colors
              hover:bg-surface-dim
            "
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <button
            onClick={handleNext}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-surface-variant
              transition-colors
              hover:bg-surface-dim
            "
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div
        className="
          flex
          justify-center
          bg-[#F8FAFC]
          p-6
        "
      >
        <div
          className="
            relative
            h-[700px]
            w-full
            max-w-3xl
            overflow-hidden
            rounded-xl
            bg-white
            shadow-xl
          "
        >
          {images[currentIndex] ? (
            <Image
              src={images[currentIndex]}
              alt={`Preview ${currentIndex + 1}`}
              fill
              className="
                object-contain
                transition-all
                duration-300
              "
            />
          ) : null}
        </div>
      </div>

      {/* Pagination */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-2
          py-4
        "
      >
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-2.5
              rounded-full
              transition-all
              duration-200
              ${index === currentIndex ? "w-8 bg-primary" : "w-2.5 bg-outline"}
            `}
          />
        ))}
      </div>
    </div>
  );
}
