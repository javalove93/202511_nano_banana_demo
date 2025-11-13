#!/bin/bash

# This script tails the logs of the Cloud Run service.

source .env

# --- Configuration ---
# Replace with your Google Cloud Project ID
PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID}
REGION=${CLOUD_RUN_REGION}
SERVICE_NAME=${SERVICE_NAME}

echo "Tailing logs for Cloud Run service: ${SERVICE_NAME} in project ${PROJECT_ID}"
echo "Press Ctrl+C to stop tailing logs."

gcloud run services logs read "${SERVICE_NAME}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --format="default"

gcloud beta run services logs tail ${SERVICE_NAME} --project=${PROJECT_ID} --region=${REGION}

if [ $? -ne 0 ]; then
    echo "Failed to tail logs. Ensure the service name and project ID are correct and you have permissions."
    exit 1
fi
