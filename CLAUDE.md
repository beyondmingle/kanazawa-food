# CLAUDE.md

金沢市 食のバリアフリーマップ（旧 kanazawa-food.jp）を GitHub Pages で公開しているリポジトリ。
運営は市民団体「るみえ～る」。日常の更新はエンジニアでない人が行う。文字の更新（お店、お知らせ）は Google スプレッドシートだけで完結し、写真を追加・差し替えるときだけ GitHub のブラウザ画面（「Add file」→「Upload files」）で `shops/` や `news/` にアップロードする。運営者向けの手順は `運用手順.md`。

## 前提と方針

- 公開先: `https://beyondmingle.github.io/kanazawa-food/`（リポジトリ `beyondmingle/kanazawa-food`、main ブランチを「Deploy from a branch」で公開）。将来 `kanazawa-food.jp` を割り当てる予定。
- ビルド工程なし。素の HTML / CSS / JavaScript のみ。npm やフレームワークを持ち込まない。
- パスはすべて相対パスにする。リポジトリ名は一度 `kanazawa-food-images` から変えているので、リポジトリ名や絶対 URL を書き込まない。
- データはスプレッドシートを「ウェブに公開」した CSV をブラウザから直接読む。サーバーや API キーは使わない。費用は無料のまま保つ。
- 非エンジニアが触る設定は `site.js` の冒頭（`KF_CONFIG`）に集める。コメントは日本語で、何を書き換えればよいかがわかるように書く。
- 外部ライブラリは CDN の版を固定する（現状 Leaflet 1.9.4 を cdnjs から）。

## ファイル構成

| パス | 役割 |
| --- | --- |
| `index.html` | トップ。タイトル、リード文、4 条件のアイコン（`search.html?f=1`〜`4` へのリンク）、最新のお知らせ 3 件、バナー、X と Instagram の埋め込み |
| `search.html` | お店を探す。条件絞り込み、一覧（20 件ずつのページ送り）と地図の切り替え、詳細ダイアログ（写真、Google マップの埋め込み） |
| `news.html` | お知らせ。`?id=` なしで一覧（10 件ずつ）、`?id=62` で記事 |
| `about.html` | 運営者情報（日英の本文を HTML に直書き） |
| `404.html` | 旧サイトの URL を新ページへ転送（`/search/?f=1`、`/shops/10/`、`/news/62/`、`/about/`、`/en/...`）。github.io のときは先頭のリポジトリ名を土台として扱う |
| `site.js` | `KF_CONFIG`（CSV の URL、件数）と共通部品（`window.KF`: CSV 読み込み、リンク変換、日付、ヘッダー・フッターの差し込み） |
| `site.css` | 共通の見た目（色の変数、ヘッダー、フッター、ボタン、お知らせの行） |
| `site/` | ロゴ、アイコン、バナー、OGP 画像。`site/design/` は背景の質感、イラスト、吹き出しなど |
| `shops/` | 店舗写真（`<shop_id>_01.jpg` など） |
| `news/` | お知らせの写真（`<4桁番号>_01.jpg`、一覧用 `<4桁番号>_thumb.jpg`） |
| `_config.yml` | GitHub Pages（Jekyll）の設定。`CLAUDE.md`、`運用手順.md` などを公開対象から外している（リポジトリ自体は公開なので github.com 上では読める） |
| `運用手順.md` | 運営者向けの更新手順（お店の追加、写真、お知らせ）。画面や列を変えたら、こちらも合わせて直す |

`site/design/` の `folk.png` と `knife.png` はファイル名と中身が逆（`folk.png` がナイフ、`knife.png` がフォーク）。元サイトと同じく、リード文の左に `folk.png`、右に `knife.png` を置いている。

## データ（Google スプレッドシート）

1 つのスプレッドシートに 3 枚のシートがある。

- `shops`: 掲載店のデータベース。運営者が直接編集する。対応項目は TRUE / FALSE のチェックボックス。
- `public`: `shops` から公開してよい列だけを抜き出した数式のシート（`=FILTER({shops!A:E,shops!G:M,shops!O:AD,shops!AH:AL},shops!A:A<>"")`）。CSV として公開し、`KF_CONFIG.SHOPS_CSV_URL` で読む。メールアドレスなどは含めない。
- `news`: お知らせ。CSV として公開し、`KF_CONFIG.NEWS_CSV_URL` で読む。

ページは列の位置ではなく 1 行目の見出しで項目を読む。見出しの名前を変えるとページ側も直す必要がある。`public` の数式は `shops` の列の位置に依存するので、`shops` に列を足すときは右端に足し、`public` の数式も合わせて直す。

`public` の列: `shop_id, name_ja, name_en, subname_ja, subname_en, address_ja, address_en, lat, lng, area_ja, area_en, phone, website, hours_ja, hours_en, closed_ja, closed_en, has_parking, parking_ja, parking_en, egg_milk_free, wheat_free, vegetarian, vegan, no_smoking, separated_smoking, can_customize, ingredients_listed, menu_ja, menu_en, description_ja, description_en, image_files`

`news` の列: `news_id, date (YYYY-MM-DD), title_ja, body_ja, title_en, body_en, images (カンマ区切り), thumb, published (チェックボックス)`

お知らせ本文の書き方（`news.html` が解釈する）: 1 行が 1 段落。URL とメールアドレスは自動でリンク。`[文字](URL)` で文字リンク。`[写真1]` だけの行に `images` の 1 枚目を出す（本文で使わなかった写真は末尾にまとめて出す）。`title_en` / `body_en` が空なら英語版でも日本語を出し、「日本語のみ」と添える。

## 写真のファイル名の規則

ページはファイル名を組み立てず、スプレッドシートに書かれた名前をそのまま読む（`shops/<image_files の各要素>`、`news/<images の各要素>`、`news/<thumb>`）。規則は運用上の約束で、`運用手順.md` にも同じことを書いている。変えるときは両方を直す。

- 店舗写真: `shops/<shop_id>_<2桁連番>.<jpg|png>`（例: `10_01.jpg`、`79_02.png`）。`shop_id` は 0 埋めしない、連番は `01` から。拡張子は半角小文字。1 店 3 枚まで（詳細ダイアログは枚数ぶん横に等分して並べるので、4 枚以上は小さくなる）。`image_files` 列にカンマ区切りで書き、1 枚目が一覧のタイルと地図の吹き出しに使われる。移植時点では 185 枚すべてこの形式（jpg 150、png 35）。
- お知らせ写真: `news/<4桁0埋めの news_id>_<2桁連番>.<jpg|png>`（例: `0062_01.jpg`）、一覧用の小さい画像は `news/<4桁>_thumb.<jpg|png>`。本文の `[写真1]` が `images` の 1 枚目に対応する。
- GitHub Pages は大文字・小文字を区別する。差し替えは同じファイル名で上書きする（スプレッドシートの修正は不要）。目安は横長 4:3、横 1200px 程度、1MB 以下。

## 画面の仕様（主なもの）

- 言語: どのページも `?lang=en` で英語。各ページ右上（トップは左上）の切り替えで行き来する。リンクは `KF.href()` を使って `lang` を引き継ぐ。
- `search.html` の URL 引数: `?f=1`〜`4`（元サイト互換。1 卵・乳なし、2 小麦なし、3 ベジタリアン、4 ヴィーガン、`?f=1,4` で組み合わせ）、`?c=has_parking`（条件名）、`?area=`、`?q=`、`?view=map`、`?shop=10`（その店の詳細を開く）、`#egg_milk_free,vegan`（ハッシュでも可）。操作後の URL には `lang`、`csv`、`v`、`view` だけ残す。
- 地図: Leaflet と国土地理院の淡色タイル（`cyberjapandata.gsi.go.jp/xyz/pale`、出典表示が必要）。ホイールでの拡大縮小は地図を一度押してから有効。
- 詳細の地図: `https://maps.google.com/maps?q=<lat>,<lng>&z=16&output=embed`（API キー不要の埋め込み）。
- デザインは元サイトの素材（麻の紙の背景、木目の帯、ロゴのピンク、お母さんと子どものイラスト）に合わせている。トップのイラストと吹き出しの位置は元サイトの CSS の値（タイトル画像の 65% / 65% の位置、吹き出しはイラストの左 84%・上 -20px）を使っている。

## 動作確認

CSV は Google から読むので、ローカルでは CSV を手元に置いて確認する。

- `search.html` は `?csv=public.csv` で読み込む CSV を差し替えられる。
- 他のページは `site.js` の URL を一時的にローカルの CSV に書き換えて確かめ、コミット前に戻す。
- `python3 -m http.server` で配信し、Playwright でパソコン幅（1280px）とスマートフォン幅（390px）の両方を確認する。404 の転送を確かめるときは、存在しないパスに `404.html` を返す小さなサーバーを使う。
- 日英の両方、絞り込み件数（卵・乳なし 46、小麦なし 51、ベジタリアン 32、ヴィーガン 29 が移植時点の値）、写真の表示を確かめる。

公開後に古い表示が出るのは GitHub Pages とブラウザのキャッシュ（最大 10 分程度）。確認時は URL に `?v=2` などを付ける。GitHub の「pages build and deployment」が Queued や Timeout で止まることがあるが、GitHub 側の問題なので Re-run で直る。

## 残っている課題

- `search.html` に、Google Sites に埋め込んでいた頃の名残がある（ホームの部品から条件を引き継ぐ `HANDOFF_KEY` の localStorage 処理、iframe 内で詳細ダイアログをタイルの近くに出す処理）。今の構成では不要なので整理してよい。
- 共通の色の変数が `site.css` と `search.html` の両方にある。`search.html` を `site.css` に寄せて重複を減らしたい。
- お知らせ 36 の「食のバリアフリーマップ仮登録」は旧サイトの登録フォーム（`/shops/register/`）を指していて、今は存在しない。登録を受け付けるなら Google フォームに差し替える。
- 英訳がない: お知らせは全件日本語のみ。一部の店舗は英語の欄が日本語のまま。
- データの確認待ち: 喫煙区分 `preparation`、アレルゲン対応・原材料開示の値 `2` の意味、エリア未設定の 4 店舗（北欧カフェapila、Coil、TILE、barrier）。
- 独自ドメイン `kanazawa-food.jp` の割り当て（Settings → Pages の Custom domain と DNS の設定）。
- 中身を JavaScript で描くため、検索エンジンへの載り方が弱い。必要なら GitHub Actions で店舗ごと・お知らせごとの静的ページを書き出す。

## 文章のルール

- 画面の文言とコメントは日本語が基本。英語版の文言は `?lang=en` 用に用意する。
- 英文では、em-dash（—）で挟む挿入句を使わない。
- 運営者向けの説明は、専門用語を避け、どこを押して何を書き換えればよいかを具体的に書く。
