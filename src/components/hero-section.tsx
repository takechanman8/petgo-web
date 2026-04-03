"use client";

import { useEffect, useRef, useState } from "react";

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function useCountUp(target: number, duration = 2000, suffix = "") {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, suffix]);

  const value = formatNumber(current) + suffix;
  return { value, ref };
}

export function HeroSection() {
  const tags = ["ドッグラン付き", "猫OK", "大型犬歓迎", "温泉"];

  const stat1 = useCountUp(2400, 2000, "+");
  const stat2 = useCountUp(15000, 2200, "+");
  const stat3 = useCountUp(98, 1800, "%");

  const stats = [
    { ...stat1, label: "掲載施設" },
    { ...stat2, label: "レビュー" },
    { ...stat3, label: "満足度" },
  ];

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 pt-24 pb-12">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl w-full text-center">
        {/* Catchcopy */}
        <h1 className="text-[44px] sm:text-[52px] font-black text-white leading-[1.2] tracking-tight mb-4 drop-shadow-lg" style={{ color: 'white' }}>
          ペットと一緒に、
          <br className="sm:hidden" />
          どこへでも。
        </h1>
        <p className="text-white text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm" style={{ color: 'white' }}>
          2,400以上の施設から、あなたとペットにぴったりの場所を見つけよう
        </p>

        {/* Search box */}
        <div className="bg-white rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="エリア・施設名・キーワードで検索..."
              className="flex-[2] px-4 py-3 border border-gray-200 rounded-xl text-[15px]"
            />
            <select className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[15px]">
              <option value="">施設タイプ</option>
              <option>ホテル・旅館</option>
              <option>カフェ・レストラン</option>
              <option>ドッグラン</option>
              <option>動物病院</option>
              <option>ペットサロン</option>
            </select>
            <select className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[15px]">
              <option value="">ペットサイズ</option>
              <option>小型犬</option>
              <option>中型犬</option>
              <option>大型犬</option>
              <option>猫</option>
            </select>
          </div>
          <button className="mt-3 w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#FF6F00] text-white font-bold text-base hover:bg-[#E65100] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            検索する
          </button>
        </div>

        {/* Popular tags */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-white/70 text-sm">人気：</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white hover:bg-white/25 cursor-pointer transition-all border border-white/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats with count-up */}
        <div className="mt-10 grid grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} ref={stat.ref} className="animate-count-in">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {stat.value}
              </div>
              <div className="text-white/80 text-sm mt-1.5 font-medium drop-shadow-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
