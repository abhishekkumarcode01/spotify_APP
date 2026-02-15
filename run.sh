#!/bin/bash

echo "========================================"
echo "  MusicHub - Music Player"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "[1/3] Checking Python installation..."
python3 --version
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[2/3] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created successfully!"
else
    echo "[2/3] Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "[3/3] Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi
echo "Virtual environment activated!"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "Dependencies installed successfully!"
echo ""

echo "========================================"
echo "  Starting MusicHub..."
echo "========================================"
echo ""
echo "The application will be available at:"
echo "  - Desktop: http://localhost:5000"
echo "  - Mobile: Use your computer's IP address"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Run the application
python app.py
