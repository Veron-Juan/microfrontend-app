# news-ssr is the only remote that needs a server: it renders on every request.
# It's built from the monorepo root, because it uses the @mfe/design-tokens package:
#   docker build -f apps/news-ssr/Dockerfile -t news-ssr .
#   docker run -p 5003:5003 news-ssr
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Only the manifests first: if the dependencies don't change, Docker reuses this layer.
# npm needs every workspace's package.json to validate the lockfile.
COPY package.json package-lock.json .npmrc ./
COPY apps/catalog/package.json apps/catalog/
COPY apps/details/package.json apps/details/
COPY apps/guide-ssg/package.json apps/guide-ssg/
COPY apps/news-ssr/package.json apps/news-ssr/
COPY apps/shell/package.json apps/shell/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/figures/package.json packages/figures/
RUN npm ci --omit=dev --workspace news-ssr --no-audit --no-fund

COPY packages/design-tokens packages/design-tokens
COPY apps/news-ssr apps/news-ssr

WORKDIR /app/apps/news-ssr
USER node
ENV PORT=5003
EXPOSE 5003
HEALTHCHECK --interval=30s --timeout=3s CMD ["node", "-e", "fetch(`http://localhost:${process.env.PORT}/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# node directly (not npm) so it receives SIGTERM and shuts down gracefully. tsx compiles the TypeScript on load.
CMD ["node", "--import", "tsx", "src/server.ts"]
