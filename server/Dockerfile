FROM node:20.12.0
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --no-cache 
COPY . .
EXPOSE 5000
CMD ["npm", "start"]