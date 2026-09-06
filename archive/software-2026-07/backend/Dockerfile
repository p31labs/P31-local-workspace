# ═══════════════════════════════════════════════════════════════
# P31 Q-Suite Backend Dockerfile
# ═══════════════════════════════════════════════════════════════
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install

# Create non-root user for security
RUN useradd --create-home appuser

# Copy application code
COPY spoons_api.py .
COPY qsuite_agent_red.py .
COPY qsuite_agent_blue.py .
COPY run_q_suite.py .
COPY Q_SUITEDOCUMENTATION.md .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose API port (keeping 8031 for backward compatibility)
EXPOSE 8031

# Default command - run the API server
CMD ["python", "spoons_api.py"]