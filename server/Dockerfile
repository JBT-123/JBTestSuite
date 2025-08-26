FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY requirements.txt* ./

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -e ".[dev]"

COPY . .

RUN mkdir -p /app/artifacts

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]