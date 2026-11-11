FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.docker.txt .
RUN pip install --no-cache-dir -r requirements.docker.txt

# Copy application source code
COPY . .

# Expose port and run uvicorn
EXPOSE 8000
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]