"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => Promise<boolean | void>;
  onLoginRequired?: () => void;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  onLoginRequired,
  isLoggedIn,
  size = "sm",
}: FavoriteButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAnimating(true);
    await onToggle();
    setTimeout(() => setAnimating(false), 300);
  };

  const sizeClass = size === "md" ? "h-7 w-7" : "h-5 w-5";
  const padding = size === "md" ? "p-2" : "p-1.5";

  return (
    <button
      onClick={handleClick}
      className={`${padding} rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 active:scale-95 ${
        animating ? "scale-125" : ""
      }`}
      aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
    >
      <svg
        className={`${sizeClass} transition-colors duration-200 ${
          isFavorite ? "text-red-500" : "text-gray-400"
        }`}
        fill={isFavorite ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
