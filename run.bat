@echo off
echo ========================================
echo   MusicHub - Music Player
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://python.org
    pause
    exit /b 1
)

echo [1/3] Checking Python installation...
python --version
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo [2/3] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully!
) else (
    echo [2/3] Virtual environment already exists
)
echo.

REM Activate virtual environment
echo [3/3] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo Virtual environment activated!
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo ========================================
echo   Starting MusicHub...
echo ========================================
echo.
echo The application will be available at:
echo   - Desktop: http://localhost:5000
echo   - Mobile: Use your computer's IP address
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Run the application
python app.py

pause
