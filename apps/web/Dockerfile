# Use the official Node image as the base image
FROM node:20-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the entire monorepo into the container
# This is necessary because the web app depends on @workspace/ui
COPY . .

# Install dependencies for the whole monorepo
RUN pnpm install

# Build the web application
RUN pnpm --filter web build

# Notify Docker that the application in the container listens on port 3000
EXPOSE 3000

# Specify the command to run the production server once the container launches
CMD ["pnpm", "--filter", "web", "start"]
