"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePoints } from "@/hooks/usePoints";
import { useFavorites } from "@/hooks/useFavorites";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { isPassMember } = useSubscription(user);
  const { totalPoints } = usePoints(user);
  const { favoriteIds } = useFavorites(user);
  const favCount = favoriteIds.size;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-black">
            <span className="text-2xl">🐾</span>
            <span className="text-primary">PetGo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: "/search", label: "おでかけ先を探す" },
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

          {/* Desktop: account area */}
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <>
              {/* Desktop account controls */}
              <div className="relative hidden md:flex items-center gap-4" ref={menuRef}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                  <span>保有ポイント</span>
                  <span>{totalPoints.toLocaleString()}</span>
                </span>
                {isPassMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    PASS
                  </span>
                )}
                <Link
                  href="/mypage?tab=favorites"
                  className="relative flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="お気に入り"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
                      {favCount}
                    </span>
                  )}
                </Link>
                <button
                  className="relative flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
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
                  <span className="text-[13px] font-medium" style={{ color: "#555" }}>
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
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      className="block w-full text-left px-5 py-3 text-sm font-medium text-text-heading hover:bg-section-bg transition-colors"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile: hamburger button */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="メニュー"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="hidden md:inline-flex rounded-xl px-5 py-2.5 text-sm font-bold transition-all bg-primary text-white hover:bg-primary-dark shadow-sm"
              >
                ログイン
              </button>
              {/* Mobile: hamburger for non-logged-in */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="メニュー"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-in-right flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-bold text-primary">PetGo</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info */}
            {user ? (
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">{displayName}さん</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    {totalPoints.toLocaleString()} pt
                  </span>
                  {isPassMember && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      PASS
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => { signInWithGoogle(); setDrawerOpen(false); }}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors"
                >
                  ログイン
                </button>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-2">
              {user && (
                <>
                  <DrawerLink href="/mypage?tab=favorites" icon="heart" label="お気に入り" onClick={() => setDrawerOpen(false)} />
                  <DrawerLink href="/mypage" icon="bell" label="通知" badge onClick={() => setDrawerOpen(false)} />
                  <DrawerLink href="/mypage" icon="user" label="マイページ" onClick={() => setDrawerOpen(false)} />
                  <div className="my-1 mx-5 border-t border-gray-100" />
                </>
              )}
              <DrawerLink href="/search" icon="search" label="おでかけ先を探す" onClick={() => setDrawerOpen(false)} />
              <DrawerLink href="/features" icon="star" label="特集" onClick={() => setDrawerOpen(false)} />
              <DrawerLink href="/magazine" icon="book" label="PetGoマガジン" onClick={() => setDrawerOpen(false)} />
              <DrawerLink href="/pass" icon="pass" label="PetGo PASS" onClick={() => setDrawerOpen(false)} />
            </nav>

            {/* Logout */}
            {user && (
              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => { signOut(); setDrawerOpen(false); }}
                  className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  );
}

function DrawerLink({ href, icon, label, badge, onClick }: { href: string; icon: string; label: string; badge?: boolean; onClick: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    heart: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    bell: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    user: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    search: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    star: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    book: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    pass: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400 relative">
        {icons[icon]}
        {badge && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />}
      </span>
      {label}
    </Link>
  );
}
