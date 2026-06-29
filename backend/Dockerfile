FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and data dependencies
COPY backend/ backend/
COPY etl/output/ etl/output/

EXPOSE 8002

# Run the API
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8002"]
