# Use official Node.js 20 LTS image on Debian Bookworm
FROM node:20-bookworm-slim

# Prevent interactive prompts during package install
ENV DEBIAN_FRONTEND=noninteractive

# Install OpenJDK 17, curl, unzip, git and dependencies needed for Android SDK
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    ca-certificates \
    curl \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set Java Environment
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Install Android Command-line Tools & SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools \
    && curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdline-tools.zip \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools \
    && mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip \
    && yes | sdkmanager --licenses \
    && sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Set up user with full write permissions
RUN useradd -m -u 1000 user || true
RUN chmod -R 777 ${ANDROID_HOME}

# Set working directory
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application source code
COPY . .

# Build bundled backend server
RUN npm run build

# Ensure write permissions for apks and temp directory
RUN mkdir -p /app/apks /app/worker-temp && chmod -R 777 /app

# Environment configuration (Render uses 10000 by default, Cloud Run 8080)
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000 8080 7860 3000

USER user

# Start the built production server
CMD ["npm", "start"]
