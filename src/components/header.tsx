"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-1 text-xl font-bold text-primary">
          <span className="text-2xl">🐾</span>
          <span>PetGo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            施設を探す
          </Link>
          <Link href="/features" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            特集
          </Link>
          <Link href="/magazine" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            PetGoマガジン
          </Link>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-light transition-colors"
        >
          ログイン
        </Link>
      </div>
    </header>
  );
}
