# Placeholder Passenger Webapp Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY passenger-webapp/package.json passenger-webapp/package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY passenger-webapp/ ./

RUN npm run build

FROM nginx:alpine


COPY --from=build /app/build /usr/share/nginx/html

COPY passenger-webapp/nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
