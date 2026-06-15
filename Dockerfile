FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_API=https://study-ai-fqk6.onrender.com
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
