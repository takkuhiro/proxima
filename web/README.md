# Proxima Web フロントエンド (Next.js)

このディレクトリは Proxima プロジェクトのフロントエンドを担う **Next.js 14 (App Router)** アプリケーションです。
キャリア管理・クエスト・チャット UI など、エンジニアを支援する全機能をブラウザから快適に操作できます。

---

## 特徴

- **App Router + Server Actions** を活用した最新アーキテクチャ
- UI コンポーネントは [shadcn/ui](https://ui.shadcn.com/) ベースで統一感のあるデザイン
- [Drizzle ORM](https://orm.drizzle.team/) で型安全に CloudSQL / SQLite へアクセス
- 環境毎に Firebase Auth を切り替えられる柔軟な認証
- [Sonner](https://sonner.emilkowalski.dev/) によるトースト通知
- 型チェック & Lint: **TypeScript** / **Biome** / **ESLint**

## ディレクトリ構成

```text
web/
  app/           ── Next.js App Router (ページ・レイアウト)
  components/    ── 再利用可能な UI コンポーネント
  hooks/         ── React カスタムフック
  lib/           ── 共通ユーティリティ、Firebase、DB ラッパー
  db/            ── Drizzle スキーマ & マイグレーション
  public/        ── 画像・アイコンなど静的アセット
  .next/         ── ビルド出力 (gitignore)
```

## セットアップ

### 1. 前提環境

- Node.js **18 以上**
- pnpm または npm
- （DB をローカルで使う場合）Docker + Docker Compose

### 2. 環境変数

`.env.local` を作成し、以下の変数を設定してください。

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# API エンドポイント
NEXT_PUBLIC_API_ORIGIN=http://localhost:8080

# Drizzle (開発用 SQLite の場合は不要)
DATABASE_URL="mysql://user:password@127.0.0.1:3306/proxima"
```

> Firebase の値は Firebase Console から取得してください。  
> `NEXT_PUBLIC_*` で始まる変数はブラウザに公開される点に注意してください。

### 3. 依存パッケージのインストール

```bash
pnpm install # または npm install
```

### 4. 開発サーバー起動

```bash
pnpm dev
# ブラウザで http://localhost:3000
```

### 5. Lint / Format / 型チェック

```bash
pnpm lint       # ESLint + Biome
pnpm format     # Biome format
pnpm typecheck  # TypeScript 型チェック (tsc --noEmit)
```

### 6. DB マイグレーション (Drizzle)

```bash
# スキーマ変更後にマイグレーションファイルを生成
pnpm db:generate

# 生成された SQL を DB に適用
pnpm db:migrate
```

---

## Cloud Run へのデプロイ

```bash
# ビルド
docker build -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/proxima/proxima-web:latest .
# Push
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/proxima/proxima-web:latest
# Deploy
gcloud run deploy proxima-web \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/proxima/proxima-web:latest \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars $(cat .env | xargs)
```
