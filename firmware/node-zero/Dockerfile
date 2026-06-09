# Dockerfile — ESP-IDF v5.5 build environment for Node Zero
# Usage: docker build -t nodezero-build -f 05_FIRMWARE/node-zero/Dockerfile .
FROM espressif/idf:release-v5.5

# Install Python deps
RUN pip install --no-cache-dir esptool pyyaml

# Set workdir
WORKDIR /workspace

# Copy only what's needed for dependency install (layer cache)
COPY 05_FIRMWARE/node-zero/requirements.txt /tmp/requirements.txt 2>/dev/null || true
# If you have a Python requirements file for additional tools, list it.

# Build command override
# At runtime: docker run --rm -v $PWD:/workspace nodezero-build bash -c "idf.py build"
