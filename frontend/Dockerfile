FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_BACKEND_URL
ARG VITE_WS_URL
ARG VITE_KAKAO_MAP_KEY
# 👇 새로 추가된 부분
ARG VITE_KEA_API_KEY
ARG VITE_KOSIS_API_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY
# 👇 새로 추가된 부분
ENV VITE_KEA_API_KEY=$VITE_KEA_API_KEY
ENV VITE_KOSIS_API_KEY=$VITE_KOSIS_API_KEY

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
