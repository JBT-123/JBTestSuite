# Use Python as the base image
FROM python:3.11-slim

# Optional quality-of-life envs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Set the working directory
WORKDIR /app

# Copy project metadata and source BEFORE installing
COPY pyproject.toml ./
COPY src ./src

# Install the package (and its deps) from pyproject.toml
RUN pip install .

# Expose the port the server runs on
EXPOSE 8000

# Start the FastAPI server
# Ensure your pyproject includes fastapi/uvicorn (e.g. fastapi[standard]) as dependencies.
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
