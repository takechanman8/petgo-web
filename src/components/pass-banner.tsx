export function PassBanner() {
  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-r from-accent to-accent-light p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full bg-white" />
        </div>
        <div className="relative">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium text-white mb-4">
            PetGo PASS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            月額¥480で、もっとお得に。
          </h2>
          <p className="text-amber-100 max-w-xl mx-auto mb-6 text-sm sm:text-base">
            会員限定割引・優先予約・ポイント2倍など、ペットとのお出かけがもっと楽しくなる特典が満載。
          </p>
          <button className="rounded-full bg-white px-8 py-3 text-sm font-bold text-accent hover:bg-amber-50 transition-colors">
            PetGo PASSを詳しく見る
          </button>
        </div>
      </div>
    </section>
  );
}
