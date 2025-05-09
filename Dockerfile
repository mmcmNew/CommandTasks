# Этап 1: Сборка
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production

# Копируем package.json и lock-файл
COPY package*.json ./

# Устанавливаем только production-зависимости (если нужны dev — убери флаг)
RUN npm ci --omit=dev

# Копируем остальной код
COPY . .

# Собираем проект
RUN npm run build


# Этап 2: Финальный образ
FROM node:20-alpine

WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production

# Копируем только собранный билд и нужные файлы из builder
COPY --from=builder /app ./

# Определяем команду запуска
CMD ["npm", "start"]
