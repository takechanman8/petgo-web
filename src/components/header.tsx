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

  const avatarUrl = user?.user_metadata?.avatar_url;

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
          <div className="relative flex items-center gap-2.5" ref={menuRef}>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
              <span>保有ポイント</span>
              <span>{totalPoints.toLocaleString()}</span>
            </span>
            {isPassMember && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                PASS
              </span>
            )}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="アバター"
                  className="h-9 w-9 rounded-full object-cover border-2 border-primary shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
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
