# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the client runs on
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "start", "--", "--host"]
