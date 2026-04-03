import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-10 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 text-xl font-black text-white">
              <span className="text-2xl" style={{ filter: 'brightness(0) invert(1)' }}>🐾</span>
              <span>PetGo</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              ペット同伴OKの施設を簡単に探せるレビュー＆予約プラットフォーム
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">サービス</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">施設を探す</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">特集</Link></li>
              <li><Link href="/magazine" className="hover:text-white transition-colors">PetGoマガジン</Link></li>
              <li><Link href="/pass" className="hover:text-white transition-colors">PetGo PASS</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">施設オーナー向け</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/owner" className="hover:text-white transition-colors">施設を掲載する</Link></li>
              <li><Link href="/owner/pricing" className="hover:text-white transition-colors">料金プラン</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">サポート</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/help" className="hover:text-white transition-colors">ヘルプセンター</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">会社概要</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          © 2026 PetGo Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
