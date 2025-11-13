# Use the official Python image as a base image
FROM python:3.11-slim-bookworm

# Set the working directory in the container
WORKDIR /app

# Install build dependencies for PyAudio
RUN apt-get update && apt-get install -y \
    build-essential \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the application code into the container
COPY requirements.txt .
COPY .env .
COPY *.py ./
COPY templates/ templates/
COPY static/ static/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port that the application will listen on
# Cloud Run typically expects applications to listen on port 8080
ENV PORT 8080
EXPOSE $PORT
# ENV GOOGLE_APPLICATION_CREDENTIALS /app/sa-key-251130-exp.json

# Run the application using Gunicorn with 1 worker and 5 threads to match Cloud Run's concurrency
# Assuming app.py contains the Flask application instance named 'app'
CMD gunicorn --workers 1 --threads 5 --bind 0.0.0.0:$PORT app:app
