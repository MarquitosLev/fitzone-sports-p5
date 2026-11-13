# Etapa 1: build de Vite. Las VITE_* se leen al compilar, no al ejecutar:
# por eso la URL de la API entra como ARG de build y no como variable del contenedor.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build

# Etapa 2: nginx sirve los estáticos; la imagen final no lleva Node ni node_modules
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
