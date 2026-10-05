FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_DEV_TEST_USERS=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DEV_TEST_USERS=$VITE_DEV_TEST_USERS
ENV VITE_USE_MOCKS=false
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
