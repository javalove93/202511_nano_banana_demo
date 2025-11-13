#!/bin/bash

# Check if uv is installed
if ! command -v uv &> /dev/null
then
    echo "uv could not be found, please install it first (e.g., pip install uv)"
    exit 1
fi

# Default virtual environment directory
VENV_DIR=".venv"

echo "Setting up Python virtual environment with uv..."

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment in $VENV_DIR"
    uv venv "$VENV_DIR"
else
    echo "Virtual environment already exists in $VENV_DIR"
fi

# Activate the virtual environment
source "$VENV_DIR/bin/activate"

# Install or update dependencies from requirements.txt
echo "Installing/updating dependencies from requirements.txt"
uv pip install -r requirements.txt

echo "Virtual environment setup complete."
echo "To activate it, run: source $VENV_DIR/bin/activate"
