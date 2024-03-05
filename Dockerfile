FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app  

# Install app dependencies
RUN npm install

# Bundle app source
COPY . /app

# Expose the port the app runs on
EXPOSE 3000

# Serve the app
CMD ["npm", "start"]
