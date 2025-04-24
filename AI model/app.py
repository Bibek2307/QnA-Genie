from flask import Flask, request, jsonify
import os
import sys
import torch

# Add the parent directory to Python path to ensure imports work the same way
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    # Import after path setup - import the exact same instances
    from model.predict import (
        predict_relevance,
        model,  # Import the singleton model instance
        tokenizer,  # Import the singleton tokenizer instance
        dataset_path
    )
except Exception as e:
    print(f"Fatal error: Could not load model: {str(e)}")
    sys.exit(1)

app = Flask(__name__)

# Print model info at startup
print(f"\nAPI Server Info:")
print(f"Model path: {os.path.abspath(model.model_path)}")
print(f"Dataset path: {dataset_path}")
print(f"Model type: {type(model).__name__}")
print(f"Tokenizer type: {type(tokenizer).__name__}\n")

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the relevance prediction API"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    question = data.get('question')
    topic = data.get('topic')
    
    if not question or not topic:
        return jsonify({"error": "Missing question or topic"}), 400
    
    try:
        # Use test_prediction to get identical output
        score = predict_relevance(question, topic)
        
        # Use same thresholds as predict.py
        is_relevant = score >= 0.5
        confidence = score if is_relevant else (1 - score)
        
        return jsonify({
            "result": "Relevant" if is_relevant else "Not Relevant",
            "confidence": round(float(confidence * 100), 2),
            "score": round(float(score), 4),
            "question": question,
            "topic": topic,
            "model_path": os.path.abspath(model.model_path) if hasattr(model, 'model_path') else "unknown"
        })
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify model behavior"""
    test_cases = [
        ("What is cell?", "Biology"),
        ("What is photosynthesis?", "Biology"),
        ("How to make coffee?", "Biology"),
        ("What is quantum computing?", "Quantum Computing: The Next Frontier"),
        ("What is the capital of Japan?", "Cybersecurity Trends and Challenges")
    ]
    
    results = []
    for question, topic in test_cases:
        score = predict_relevance(question, topic)
        is_relevant = score >= 0.5
        confidence = score if is_relevant else (1 - score)
        
        results.append({
            "question": question,
            "topic": topic,
            "result": "Relevant" if is_relevant else "Not Relevant",
            "confidence": round(float(confidence * 100), 2),
            "score": round(float(score), 4)
        })
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
