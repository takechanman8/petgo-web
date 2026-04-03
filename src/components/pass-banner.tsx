import Link from "next/link";

export function PassBanner() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-accent via-accent to-accent-light p-10 sm:p-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white" />
          <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-white" />
          <div className="absolute right-1/4 bottom-0 h-32 w-32 rounded-full bg-white" />
        </div>
        <div className="relative">
          <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-5 py-1.5 text-sm font-bold text-white mb-5 border border-white/20">
            PetGo PASS
          </span>
          <h2 className="text-[28px] sm:text-[36px] font-black text-white mb-4 leading-tight" style={{ color: 'white' }}>
            月額¥480で、もっとお得に。
          </h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8 text-[15px] sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
            会員限定割引・優先予約・ポイント2倍など、
            <br className="hidden sm:block" />
            ペットとのお出かけがもっと楽しくなる特典が満載。
          </p>
          <Link
            href="/pass"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-black text-accent hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
          >
            PetGo PASSを詳しく見る
          </Link>
        </div>
      </div>
    </section>
  );
}
