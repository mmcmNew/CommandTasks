# Используем мультистейдж сборку
# Stage 1: Builder
FROM node:alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Runner
FROM node:alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем собранное приложение из предыдущего этапа
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Запускаем приложение
CMD ["npm", "start"]
