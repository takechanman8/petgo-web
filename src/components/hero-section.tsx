export function HeroSection() {
  const tags = ["ドッグラン付き", "猫OK", "大型犬歓迎", "温泉"];
  const stats = [
    { value: "2,400+", label: "掲載施設" },
    { value: "15,000+", label: "レビュー" },
    { value: "98%", label: "満足度" },
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-dark via-primary to-primary-light pt-28 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
          ペットと一緒に、どこへでも。
        </h1>
        <p className="text-green-100 text-base sm:text-lg mb-10">
          ペット同伴OKの施設を簡単に検索・予約できるプラットフォーム
        </p>

        {/* 検索ボックス */}
        <div className="mx-auto max-w-3xl bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="キーワードで検索..."
              className="col-span-1 sm:col-span-2 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <select className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">施設タイプ</option>
              <option>ホテル・旅館</option>
              <option>カフェ・レストラン</option>
              <option>ドッグラン</option>
              <option>動物病院</option>
              <option>ペットサロン</option>
            </select>
            <select className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">ペットサイズ</option>
              <option>小型犬</option>
              <option>中型犬</option>
              <option>大型犬</option>
              <option>猫</option>
            </select>
          </div>
          <button className="mt-4 w-full rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-dark transition-colors">
            検索する
          </button>
        </div>

        {/* 人気タグ */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-green-200 text-sm">人気：</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30 cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 統計 */}
        <div className="mt-12 grid grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-green-200 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
