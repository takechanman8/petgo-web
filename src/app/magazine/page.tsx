"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const articles = [
  {
    id: "1",
    title: "犬の熱中症対策 - 夏のお出かけ前に知っておきたいこと",
    category: "健康",
    date: "2025-06-15",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop",
    body: "夏場の散歩やお出かけでは、愛犬の熱中症に十分注意が必要です。犬は人間と違い汗をかけないため、パンティング（荒い呼吸）で体温を調節します。気温が30度を超える日は、早朝や夕方の涼しい時間帯に散歩を行いましょう。アスファルトは日中50度以上になることもあり、肉球のやけどにも注意が必要です。外出時は必ず水を持参し、こまめに水分補給をさせてください。車内での留守番は絶対に避け、移動中もエアコンを適切に使用しましょう。万が一ぐったりしている場合は、すぐに涼しい場所へ移動し、首や脇の下を冷やして動物病院へ連絡してください。",
  },
  {
    id: "2",
    title: "ペットと飛行機に乗るときの注意点",
    category: "旅行",
    date: "2025-06-10",
    image:
      "https://images.unsplash.com/photo-1540339832862-474599807836?w=800&h=500&fit=crop",
    body: "ペットとの空の旅には事前準備が欠かせません。まず、航空会社ごとにペットの搭乗ルールが異なるため、早めに確認・予約しましょう。機内持ち込みが可能な小型犬・猫の場合、IATA基準を満たすキャリーが必要です。大型犬は貨物室での輸送となり、気温制限がある季節は受付不可の場合もあります。出発前に動物病院で健康診断を受け、必要な書類（健康証明書・ワクチン証明書）を準備してください。フライト当日は、搭乗4時間前までに食事を済ませ、水は少量ずつ与えましょう。キャリーに慣らす練習を事前に行うと、ペットのストレス軽減に効果的です。",
  },
  {
    id: "3",
    title: "愛犬のストレスサインを見逃さない方法",
    category: "健康",
    date: "2025-06-05",
    image:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=500&fit=crop",
    body: "犬はストレスを感じると、さまざまなサインで飼い主に伝えようとします。代表的なストレスサインには、あくび、舌なめずり、体をブルブル振る、尻尾を下げるなどがあります。また、普段しない場所での排泄や、過度な毛づくろい、食欲の変化もストレスの兆候です。原因としては、環境の変化、運動不足、留守番の長時間化、大きな音などが挙げられます。ストレスを軽減するには、毎日の散歩で十分な運動をさせること、安心できるスペースを用意すること、規則正しい生活リズムを維持することが大切です。異常が続く場合は、獣医師やドッグトレーナーに相談しましょう。",
  },
  {
    id: "4",
    title: "猫と旅行するためのステップガイド",
    category: "旅行",
    date: "2025-05-28",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=500&fit=crop",
    body: "猫は環境の変化に敏感なため、旅行には段階的な準備が必要です。まずキャリーに慣れさせることから始めましょう。普段からキャリーを部屋に置き、中にお気に入りのブランケットを入れておくと安心できる場所として認識します。車での移動は短距離から練習し、徐々に時間を延ばしてください。宿泊先はペット可の施設を事前に確認し、猫用トイレや普段の食事を必ず持参しましょう。到着後はまず一部屋に限定して探索させ、少しずつ環境に慣らします。フェリモンスプレーを活用するとリラックス効果が期待できます。旅行が難しい猫には、信頼できるペットシッターの利用も検討してください。",
  },
  {
    id: "5",
    title: "ペット保険の選び方完全ガイド",
    category: "お金",
    date: "2025-05-20",
    image:
      "https://images.unsplash.com/photo-1583337130417-13104dec14a8?w=800&h=500&fit=crop",
    body: "ペット保険は万が一の高額な医療費に備える重要な手段です。選ぶ際のポイントは、補償割合（50%・70%・100%）、年間限度額、免責金額の3つを比較することです。通院・入院・手術のどこまでカバーされるかも確認しましょう。若いうちに加入すると保険料が安く、持病による加入制限も避けられます。注意点として、予防接種や去勢・避妊手術、歯科治療は多くの保険で対象外です。また、待機期間（加入から補償開始まで）がある保険もあるため、早めの検討が重要です。複数の保険を比較サイトで一括見積もりし、愛犬・愛猫の犬種や年齢に合ったプランを選びましょう。",
  },
  {
    id: "6",
    title: "ドッグランでのマナー10選",
    category: "マナー",
    date: "2025-05-15",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=500&fit=crop",
    body: "ドッグランは愛犬が自由に走り回れる素晴らしい場所ですが、マナーを守ることが大切です。入場前にリードを外す前の基本的なしつけ（呼び戻し）ができていることを確認しましょう。ヒート中のメス犬、攻撃性のある犬、ワクチン未接種の犬は入場を控えてください。排泄物は必ず持ち帰り、おもちゃやおやつは他の犬とのトラブルの原因になるため注意が必要です。小型犬と大型犬のエリアが分かれている場合は必ず守りましょう。愛犬から目を離さず、スマホに夢中にならないことも重要です。他の飼い主さんへの挨拶や、愛犬同士の相性を見極める余裕を持ちましょう。",
  },
  {
    id: "7",
    title: "ペットフレンドリーな車選びのポイント",
    category: "お出かけ",
    date: "2025-05-10",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop",
    body: "ペットとのドライブを快適にするためには、車選びも重要なポイントです。まず、後部座席やラゲッジスペースの広さを確認しましょう。大型犬の場合はSUVやミニバンがおすすめです。フラットになるラゲッジスペースがあると、クレートの設置も楽になります。後部座席用のペットシートカバーは、汚れや毛の付着を防ぐ必需品です。スライドドアの車種は乗り降りが楽で、ペットの飛び出し防止にも効果的です。エアコンの後部座席吹き出し口があると、夏場のドライブも安心です。また、ペット用のシートベルトやドライブボックスを活用し、安全な移動を心がけてください。",
  },
  {
    id: "8",
    title: "愛犬の誕生日をお祝いするアイデア集",
    category: "ライフスタイル",
    date: "2025-05-05",
    image:
      "https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=800&h=500&fit=crop",
    body: "愛犬の誕生日は、日頃の感謝を込めて特別な一日にしましょう。手作りの犬用ケーキは、さつまいもやかぼちゃをベースにヨーグルトでデコレーションすると見た目も華やかです。新しいおもちゃやおやつのプレゼントも喜ばれます。記念撮影では、バースデーハットやバンダナを着けて、お気に入りの場所で写真を撮りましょう。ペット同伴OKのレストランでお祝いディナーを楽しむのもおすすめです。お友達のワンちゃんを招いてバースデーパーティーを開くと、社会化の機会にもなります。毎年の成長記録として写真やアルバムを残しておくと、素敵な思い出になります。",
  },
  {
    id: "9",
    title: "ペットと暮らすための防災準備",
    category: "防災",
    date: "2025-04-28",
    image:
      "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800&h=500&fit=crop",
    body: "災害はいつ起こるかわかりません。ペットと一緒に安全に避難するための準備を日頃から整えましょう。まず、最低5日分のフード・水・常備薬を非常用バッグにまとめておきます。キャリーやリード、予備の首輪も忘れずに。迷子対策としてマイクロチップの装着と、首輪への連絡先記載が重要です。避難所でのペット受け入れ状況を事前に確認し、同行避難と同伴避難の違いも理解しておきましょう。クレートトレーニングを日頃から行っておくと、避難所でも落ち着いて過ごせます。ペットの写真や医療記録のコピーも携帯しておくと、万が一はぐれた時に役立ちます。",
  },
  {
    id: "10",
    title: "シニア犬との旅行で気をつけたいこと",
    category: "旅行",
    date: "2025-04-20",
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=500&fit=crop",
    body: "シニア犬（7歳以上）との旅行は、若い頃とは異なる配慮が必要です。まず旅行前に動物病院で健康チェックを受け、獣医師に旅行の可否を確認しましょう。移動時間は短めに設定し、こまめな休憩を取ることが大切です。宿泊先はバリアフリーや段差の少ない施設を選び、滑りにくいマットを持参すると安心です。関節への負担を考え、激しい運動は避けてゆったりしたプランを組みましょう。常備薬やサプリメントは多めに持参し、かかりつけ医の連絡先も控えておきます。気温の変化に弱くなっているため、季節や天候にも注意が必要です。愛犬のペースに合わせた旅を楽しんでください。",
  },
];

const categories = [
  "すべて",
  "健康",
  "旅行",
  "お金",
  "マナー",
  "お出かけ",
  "ライフスタイル",
  "防災",
];

export default function MagazinePage() {
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  const filtered =
    selectedCategory === "すべて"
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-primary/5 pt-24 sm:pt-28 pb-12 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          PetGoマガジン
        </h1>
        <p className="mt-3 text-gray-600 text-base sm:text-lg max-w-md mx-auto">
          ペットとの暮らしをもっと楽しく、もっと豊かに
        </p>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            該当する記事がありません
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/magazine/${article.id}`}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {article.category}
                    </span>
                    <time className="text-xs text-gray-400">
                      {article.date}
                    </time>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
