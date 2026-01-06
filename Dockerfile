# 本番環境用のマルチステージビルド
FROM oven/bun:1 AS base

WORKDIR /app

# 依存関係のインストール
FROM base AS deps
COPY package.json ./
# bun.lockまたはbun.lockbをコピー（バージョンにより異なる）
COPY bun.lock* ./
RUN bun install --frozen-lockfile --production || bun install --production

# ビルドステージ
FROM base AS builder
COPY package.json ./
COPY bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .

# Next.jsのビルド
RUN bun run build

# 本番環境用の実行ステージ
FROM base AS runner

# 本番環境の設定
ENV NODE_ENV=production
ENV PORT=3000

# ユーザー追加（セキュリティ向上）
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# 必要なファイルのみコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# データベース用のディレクトリを作成
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# nextjsユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/').then(() => process.exit(0)).catch(() => process.exit(1))"

# カスタムサーバーで起動
CMD ["bun", "server.ts"]
