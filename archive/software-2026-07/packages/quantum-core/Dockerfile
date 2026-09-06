# P31 Labs - Quantum Core Production Environment
# This Dockerfile builds the liboqs C library from source to enable 
# FIPS 203/204 Post-Quantum Cryptography via liboqs-node bindings.

FROM node:20-bookworm-slim AS builder

# 1. Install system dependencies required for CMake and liboqs compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    git \
    libssl-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# 2. Clone and build liboqs (Open Quantum Safe)
WORKDIR /opt
RUN git clone --branch main --single-branch https://github.com/open-quantum-safe/liboqs.git
WORKDIR /opt/liboqs
RUN mkdir build && cd build && \
    cmake -GNinja \
          -DCMAKE_INSTALL_PREFIX=/usr/local \
          -DBUILD_SHARED_LIBS=ON \
          -DOQS_USE_OPENSSL=ON \
          .. && \
    ninja && \
    ninja install

# 3. Setup Node.js Application
WORKDIR /usr/src/app

# Copy package definitions
COPY package*.json ./

# Install Node dependencies (this will now successfully build liboqs-node bindings)
# using the system liboqs installed in /usr/local
ENV LD_LIBRARY_PATH=/usr/local/lib
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# 4. Production Stage (Minimize image size)
FROM node:20-bookworm-slim

# Copy compiled liboqs from builder
COPY --from=builder /usr/local/lib/liboqs* /usr/local/lib/
COPY --from=builder /usr/local/include/oqs /usr/local/include/oqs

ENV LD_LIBRARY_PATH=/usr/local/lib

WORKDIR /usr/src/app

# Copy built application and production modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose microservice port
EXPOSE 3031

# Start the Quantum Service Manager
CMD ["node", "dist/index.js"]