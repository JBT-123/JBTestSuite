FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# OS deps
RUN apt-get update && apt-get install -y \
    curl gcc \
 && rm -rf /var/lib/apt/lists/*

# Copy only dep manifests first to leverage Docker layer cache
COPY pyproject.toml ./
COPY README.md ./
COPY requirements.txt* ./

# Install Python deps
RUN python -m pip install --upgrade pip \
 && if [ -f requirements.txt ]; then pip install -r requirements.txt; fi \
 # install your package (and dev extras) so entrypoints/imports work
 && pip install -e ".[dev]"

# Now copy the rest of the app
COPY . .

RUN mkdir -p /app/artifacts

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
