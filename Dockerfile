# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Generate Prisma Client
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Copy source code and compiled frontend
COPY backend/src ./backend/src
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["sh", "-c", "cd backend && npx prisma db push && npm start"]
