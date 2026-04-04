"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export type Feature = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  body: string;
  tag: string;
  facilityType: string;
  filterExtra?: string;
};

export const features: Feature[] = [
  {
    id: "1",
    title: "愛犬と行く温泉宿ベスト5",
    subtitle: "源泉かけ流しの贅沢な湯宿で愛犬とリラックス",
    image:
      "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=800&h=500&fit=crop",
    body: "日本各地には愛犬と一緒に温泉を楽しめる贅沢な宿が数多くあります。源泉かけ流しの露天風呂を備えた客室で、愛犬とゆったりくつろぐひとときは格別です。ペット専用のアメニティやドッグランを完備した温泉宿を厳選してご紹介します。日頃の疲れを癒しながら、愛犬との絆を深める最高の旅をお楽しみください。四季折々の自然に囲まれた温泉地で、忘れられない思い出を作りましょう。",
    tag: "宿泊",
    facilityType: "宿泊",
  },
  {
    id: "2",
    title: "猫と泊まれるおしゃれ宿特集",
    subtitle: "猫ちゃんも大満足のこだわり宿を厳選",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=500&fit=crop",
    body: "猫ちゃんと一緒に旅行したいけど、受け入れてくれる宿が見つからない…そんな悩みを解決します。猫専用の脱走防止設備やキャットタワーを完備した安心のお宿を厳選しました。おしゃれなインテリアと猫に配慮した設計で、飼い主も猫ちゃんもリラックスできる空間が広がります。猫用トイレやフードボウルも用意されているので、手荷物も最小限で大丈夫。愛猫との特別な時間をお過ごしください。",
    tag: "宿泊",
    facilityType: "宿泊",
    filterExtra: "cat_ok",
  },
  {
    id: "3",
    title: "ドッグラン付きカフェ特集",
    subtitle: "コーヒーを楽しみながら愛犬を遊ばせよう",
    image:
      "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&h=500&fit=crop",
    body: "美味しいコーヒーを味わいながら、愛犬が思いっきり走り回る姿を眺められるカフェをご紹介。ドッグラン併設のカフェなら、ワンちゃんの運動不足解消と飼い主のリフレッシュが同時に叶います。自家焙煎のこだわりコーヒーやペット用メニューが充実したお店ばかり。天然芝のドッグランや水飲み場を完備し、季節ごとのイベントも開催。愛犬家同士の交流の場としても人気の注目スポットです。",
    tag: "カフェ",
    facilityType: "カフェ",
  },
  {
    id: "4",
    title: "大型犬歓迎！広々リゾート特集",
    subtitle: "大きなワンちゃんも思いっきり走り回れる",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop",
    body: "大型犬の飼い主にとって宿泊先探しは一苦労。しかし最近は大型犬を大歓迎するリゾートが増えています。広大な敷地内にプライベートドッグランを備え、体重制限なしで愛犬とのびのび過ごせる施設を厳選しました。ゴールデンレトリバーやラブラドールなど大きなワンちゃんも安心。客室も広々設計で、大型犬用のベッドやアメニティも完備。思い出に残るリゾートステイをお楽しみください。",
    tag: "宿泊",
    facilityType: "宿泊",
    filterExtra: "large_dog",
  },
  {
    id: "5",
    title: "ペットと楽しむ春のお花見スポット",
    subtitle: "桜の下で愛犬とピクニック",
    image:
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=500&fit=crop",
    body: "春の訪れとともに、愛犬と桜を楽しめるお花見スポットをご紹介します。ペット同伴OKの公園やドッグランでは、満開の桜の下でピクニックを楽しめます。ワンちゃん用のお弁当を持参して、芝生の上でのんびりお花見はいかがでしょうか。広い敷地でリードを外して遊べるスポットや、桜並木の散歩コースなど、春ならではの楽しみ方が満載。愛犬と一緒に日本の春を満喫しましょう。",
    tag: "お出かけ",
    facilityType: "ドッグラン",
  },
  {
    id: "6",
    title: "海が見えるペット同伴OKレストラン",
    subtitle: "オーシャンビューで最高のペットディナーを",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop",
    body: "海を眺めながら愛犬と食事を楽しめるレストランを集めました。テラス席でオーシャンビューを満喫しながら、地元の新鮮な海の幸を味わえる贅沢なひととき。ペット用の水やおやつを用意してくれるお店も多く、愛犬も一緒にグルメ体験ができます。潮風を感じながらのランチやサンセットディナーは、日常を忘れる特別な時間。海沿いの散歩コースと合わせて、愛犬との最高の一日を演出しましょう。",
    tag: "レストラン",
    facilityType: "レストラン",
  },
  {
    id: "7",
    title: "初めてのペット旅行ガイド",
    subtitle: "準備から当日まで完全マニュアル",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=500&fit=crop",
    body: "初めてペットと旅行に行く方必見の完全ガイドです。持ち物リストから移動手段の選び方、宿泊先の選定ポイントまで詳しく解説します。車移動の際の注意点やペット用キャリーの選び方、旅先での体調管理の方法もカバー。事前にワクチン接種証明書や鑑札を準備しておくことも忘れずに。この記事を読めば、安心して愛犬との初めての旅行を楽しむことができます。素敵な思い出を作りましょう。",
    tag: "ガイド",
    facilityType: "宿泊",
  },
  {
    id: "8",
    title: "ペット連れキャンプ場特集",
    subtitle: "大自然の中で愛犬とアウトドアを満喫",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=500&fit=crop",
    body: "愛犬と一緒にキャンプを楽しめるスポットを特集。ペット同伴OKのオートキャンプ場やグランピング施設では、大自然の中で愛犬と最高のアウトドア体験ができます。ドッグフリーサイトや犬用シャワーを完備した施設も増加中。焚き火を囲みながら愛犬と星空を眺める贅沢な時間を過ごしませんか。初心者向けの手ぶらキャンププランもあるので、アウトドアデビューにもおすすめです。",
    tag: "アウトドア",
    facilityType: "ドッグラン",
  },
  {
    id: "9",
    title: "雨の日でも楽しめるペット施設",
    subtitle: "天気を気にせず愛犬と遊べるスポット",
    image:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=500&fit=crop",
    body: "せっかくのお出かけも雨が降ると台無し…そんなことはありません。屋内ドッグランやペット同伴OKのショッピングモール、犬カフェなど、天候に左右されずに愛犬と楽しめるスポットをご紹介。室内アジリティやペットスパ、犬のプール施設など、雨の日ならではの楽しみ方もたくさん。エアコン完備で夏の暑い日や冬の寒い日にも快適に過ごせます。いつでも愛犬とのお出かけを楽しみましょう。",
    tag: "お出かけ",
    facilityType: "カフェ",
  },
  {
    id: "10",
    title: "ペットと行く絶景ドライブコース",
    subtitle: "愛犬と一緒に走る最高のドライブルート",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop",
    body: "愛犬を乗せて絶景を巡るドライブコースを厳選してお届けします。海岸線を走るシーサイドロードや、山間部のワインディングロードなど、車窓から見える景色は最高。途中にはペット同伴OKのSAやドッグランがあるので、休憩を取りながら快適にドライブを楽しめます。愛犬の車酔い対策やドライブ時の安全グッズもご紹介。週末は愛犬と一緒に、いつもと違う景色を見に出かけてみませんか。",
    tag: "ドライブ",
    facilityType: "ドッグラン",
  },
];

const tagColors: Record<string, string> = {
  宿泊: "bg-blue-100 text-blue-700",
  カフェ: "bg-amber-100 text-amber-700",
  お出かけ: "bg-green-100 text-green-700",
  レストラン: "bg-rose-100 text-rose-700",
  ガイド: "bg-purple-100 text-purple-700",
  アウトドア: "bg-emerald-100 text-emerald-700",
  ドライブ: "bg-sky-100 text-sky-700",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-primary/5 pt-24 sm:pt-28 pb-12 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">特集</h1>
        <p className="mt-3 text-gray-600 text-base sm:text-lg max-w-md mx-auto">
          ペットとの暮らしをもっと楽しく。厳選された特集記事をお届けします。
        </p>
      </section>

      {/* Feature Cards Grid */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link
              key={f.id}
              href={`/features/${f.id}`}
              className="group rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColors[f.tag] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {f.tag}
                </span>
                <h2 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                  {f.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {f.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
