try:
    import typing
    from typing_extensions import TypedDict
    typing.TypedDict = TypedDict
except ImportError:
    pass

from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from technical_scorer import calculate_technical_score
from fundamental_scorer import calculate_fundamental_score

load_dotenv()

app = Flask(__name__)

@app.route("/", methods=["GET"])
def read_root():
    return jsonify({"status": "AI Service Running (Flask)"})

@app.route("/analyze/technical", methods=["POST"])
def analyze_technical():
    data = request.json
    symbol = data.get("symbol")
    result = calculate_technical_score(symbol)
    return jsonify({"symbol": symbol, "score": result["score"], "reasoning": result["reasoning"]})

@app.route("/analyze/fundamental", methods=["POST"])
def analyze_fundamental():
    data = request.json
    symbol = data.get("symbol")
    result = calculate_fundamental_score(symbol)
    return jsonify({"symbol": symbol, "score": result["score"], "reasoning": result["reasoning"]})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
