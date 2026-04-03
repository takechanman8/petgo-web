"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePoints } from "@/hooks/usePoints";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { isPassMember } = useSubscription(user);
  const { totalPoints } = usePoints(user);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-black">
          <span className="text-2xl">🐾</span>
          <span className="text-primary">PetGo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: "/search", label: "施設を探す" },
            { href: "/features", label: "特集" },
            { href: "/magazine", label: "PetGoマガジン" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold transition-colors text-text-body hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
        ) : user ? (
          <div className="relative flex items-center gap-4" ref={menuRef}>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
              <span>保有ポイント</span>
              <span>{totalPoints.toLocaleString()}</span>
            </span>
            {isPassMember && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                PASS
              </span>
            )}
            <Link
              href="/mypage?tab=favorites"
              className="hidden sm:flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="お気に入り"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>
            <button
              className="hidden sm:flex relative items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="お知らせ"
              onClick={() => {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="hidden sm:inline text-[13px] font-medium" style={{ color: "#555" }}>
                {user.user_metadata?.full_name ? `${user.user_metadata.full_name}さん` : user.email?.split("@")[0]}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 py-2">
                <Link
                  href="/mypage"
                  className="block px-5 py-3 text-sm font-medium text-text-heading hover:bg-section-bg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  マイページ
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-5 py-3 text-sm font-medium text-text-heading hover:bg-section-bg transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all bg-primary text-white hover:bg-primary-dark shadow-sm"
          >
            ログイン
          </button>
        )}
      </div>
    </header>
  );
}
