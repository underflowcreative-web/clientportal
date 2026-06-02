import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  clickable = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${
        clickable
          ? "hover:shadow-md hover:border-gray-300 cursor-pointer transition-all duration-150"
          : ""
      } ${className}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
