# Production image for commerce-fe (Next.js), built by .github/workflows/deploy.yml and run by Coolify.
# Build context = the repository root.
FROM docker.io/library/node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM docker.io/library/node:24-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/').then(r => process.exit(r.status < 500 ? 0 : 1), () => process.exit(1))"
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p \"$PORT\""]
