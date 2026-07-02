#!/bin/bash
set -e
echo ""
echo "🤖 CAGENT DEBUGGER - Installing cagent..."

# Installing Cagent
if ! command -v cagent &> /dev/null; then
    echo "📦 Cagent not found. Attempting install..."
    if ! command -v brew &> /dev/null; then
        echo "🍺 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install cagent
fi
echo "✅ Cagent readied"
echo ""

# Perplexity API Setup
read -p "Paste your API key: " API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ No key provided"
    exit 1
fi
export PERPLEXITY_API_KEY="$API_KEY"

# Persist to Zshrc
if [ -f ~/.zshrc ]; then
    if ! grep -q "PERPLEXITY_API_KEY" ~/.zshrc; then
        echo "export PERPLEXITY_API_KEY='$API_KEY'" >> ~/.zshrc
        echo "✅ Key saved to ~/.zshrc"
    fi
fi

echo ""
echo "🚀 Starting debugger..."
cagent run debugger.yaml
