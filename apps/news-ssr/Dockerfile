# news-ssr es el único remote que necesita un servidor: renderiza en cada request.
# Se construye desde la raíz del monorepo, porque usa el paquete @mfe/design-tokens:
#   docker build -f apps/news-ssr/Dockerfile -t news-ssr .
#   docker run -p 5003:5003 news-ssr
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Primero solo los manifiestos: si las dependencias no cambian, Docker reutiliza esta capa.
# npm necesita los package.json de todos los workspaces para validar el lockfile.
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
# node directo (no npm) para que reciba SIGTERM y cierre ordenado. tsx compila el TypeScript al cargar.
CMD ["node", "--import", "tsx", "src/server.ts"]
