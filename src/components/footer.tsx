import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-1 text-xl font-bold text-white">
              <span className="text-2xl">🐾</span>
              <span>PetGo</span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              ペット同伴OKの施設を簡単に探せるレビュー＆予約プラットフォーム
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">施設を探す</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">特集</Link></li>
              <li><Link href="/magazine" className="hover:text-white transition-colors">PetGoマガジン</Link></li>
              <li><Link href="/pass" className="hover:text-white transition-colors">PetGo PASS</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">施設オーナー向け</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/owner" className="hover:text-white transition-colors">施設を掲載する</Link></li>
              <li><Link href="/owner/dashboard" className="hover:text-white transition-colors">管理ダッシュボード</Link></li>
              <li><Link href="/owner/pricing" className="hover:text-white transition-colors">料金プラン</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">サポート</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-white transition-colors">ヘルプセンター</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © 2026 PetGo Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
