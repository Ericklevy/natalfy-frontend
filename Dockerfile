# 1) build do Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# 2) servidor estático com proxy para a API
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/natalfy-app/browser /usr/share/nginx/html
ENV API_URL=http://host.docker.internal:8081
EXPOSE 80
