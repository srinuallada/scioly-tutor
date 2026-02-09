#!/usr/bin/env bash
set -e

echo "🔬 SciOly Tutor — Local Setup"
echo "=============================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install it from https://python.org"
    exit 1
fi
echo "✅ Python $(python3 --version | cut -d' ' -f2)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install it from https://nodejs.org"
    exit 1
fi
echo "✅ Node $(node --version)"

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "   Created virtual environment"
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "   Installed Python dependencies"

# .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Add your Gemini API key to backend/.env"
    echo "   Get a free key at: https://aistudio.google.com/apikey"
    echo ""
fi

cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install --silent
echo "   Installed Node dependencies"
cd ..

# Create data dirs
mkdir -p data/uploads

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add your Gemini API key to backend/.env"
echo "  2. Place study materials in data/uploads/"
echo "  3. Process materials:"
echo "     cd backend && source venv/bin/activate"
echo "     python -m retrieval.processor ../data/uploads/"
echo ""
echo "  4. Start backend (terminal 1):"
echo "     cd backend && source venv/bin/activate"
echo "     uvicorn app:app --reload --port 8000"
echo ""
echo "  5. Start frontend (terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo "  6. Open http://localhost:5173"
echo ""
