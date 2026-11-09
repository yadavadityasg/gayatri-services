# One image definition, two surfaces (app and admin). docker-compose passes APP_SURFACE.
# Dependencies are installed with Bun, matching the existing lockfile. The
# container itself runs on Node.
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG APP_SURFACE=app
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_PUBLIC_APP_URL=http://localhost:3000
ARG VITE_ADMIN_APP_URL=http://localhost:3001

ENV APP_SURFACE=$APP_SURFACE \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    VITE_PUBLIC_APP_URL=$VITE_PUBLIC_APP_URL \
    VITE_ADMIN_APP_URL=$VITE_ADMIN_APP_URL \
    NODE_OPTIONS=--max-old-space-size=4096

RUN node scripts/build-node.mjs \
    && mkdir -p dist/client/assets \
    && if [ -d assets ]; then cp -n assets/* dist/client/assets/; fi \
    && if [ -f favicon.png ]; then cp -n favicon.png dist/client/favicon.png; fi

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    CLIENT_DIR=/app/dist/client \
    SERVER_ENTRY=/app/dist/server/server.js

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts/node-server.mjs ./scripts/node-server.mjs

EXPOSE 3000
CMD ["node", "scripts/node-server.mjs"]
