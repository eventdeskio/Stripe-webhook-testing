FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package.json ./
COPY . .
RUN  npm i --force
RUN npm run build 

FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist/stripe-frontend/browser /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 5082