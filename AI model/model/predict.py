import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import spacy
from gensim.models import Word2Vec
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import defaultdict
import os

# Global variables for singleton pattern
_model = None
_tokenizer = None
_topic_terms_cache = None

def get_model():
    """Singleton pattern for model"""
    global _model
    if _model is None:
        try:
            # Get absolute paths with double model folder
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, "model", "relevance_model")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model not found in {model_path}")
            
            # Load model with specific configuration
            _model = AutoModelForSequenceClassification.from_pretrained(
                model_path,
                local_files_only=True,  # Only use local files
                config={
                    "architectures": ["DistilBertForSequenceClassification"],
                    "model_type": "distilbert",
                    "num_labels": 2
                }
            )
            _model.eval()  # Set to evaluation mode
            # Store the path as an attribute
            _model.model_path = model_path
            print(f"Loaded model from {os.path.abspath(model_path)}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise  # Re-raise the error instead of falling back
    return _model

def get_tokenizer():
    """Singleton pattern for tokenizer"""
    global _tokenizer
    if _tokenizer is None:
        try:
            # Use same path with double model folder
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, "model", "relevance_model")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Tokenizer not found in {model_path}")
            
            _tokenizer = AutoTokenizer.from_pretrained(
                model_path,
                local_files_only=True  # Only use local files
            )
            # Store the path as an attribute
            _tokenizer.model_path = model_path
            print(f"Loaded tokenizer from {os.path.abspath(model_path)}")
        except Exception as e:
            print(f"Error loading tokenizer: {str(e)}")
            raise  # Re-raise the error instead of falling back
    return _tokenizer

# Initialize model and tokenizer at module level - with error handling
try:
    # Get absolute paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, "..", "utils", "dataset.csv")
    
    # Initialize model and tokenizer
    model = get_model()
    tokenizer = get_tokenizer()
    
    print(f"\nInitialization Info:")
    print(f"Model path: {os.path.abspath(model.model_path)}")  # Use model_path attribute
    print(f"Dataset path: {os.path.abspath(dataset_path)}")
    print(f"Current directory: {current_dir}\n")
except Exception as e:
    print(f"Fatal error loading model/tokenizer: {str(e)}")
    raise  # Stop execution if model can't be loaded

def generate_topic_terms(dataset_path, num_terms=10):
    """
    Automatically generate relevant terms for each topic using NLP techniques
    """
    # Load the English language model
    nlp = spacy.load('en_core_web_sm')
    
    # Read the dataset
    df = pd.read_csv(dataset_path)
    
    # Group questions by topic
    topic_questions = defaultdict(list)
    for _, row in df.iterrows():
        if row['relevant'] == 1:  # Only use relevant questions for term extraction
            # Add both question and topic text for better term extraction
            topic_questions[row['topic']].append(row['question'].lower())
            topic_questions[row['topic']].append(row['topic'].lower())
    
    # Initialize topic terms dictionary
    topic_terms = defaultdict(set)
    
    for topic, questions in topic_questions.items():
        # 1. Extract terms using TF-IDF with better parameters
        tfidf = TfidfVectorizer(
            stop_words='english', 
            ngram_range=(1, 3),  # Allow longer phrases
            min_df=1,  # Include all terms
            max_features=50  # Get more terms
        )
        tfidf_matrix = tfidf.fit_transform(questions)
        feature_names = tfidf.get_feature_names_out()
        
        # Get top TF-IDF terms
        for question_idx in range(len(questions)):
            scores = zip(feature_names, tfidf_matrix[question_idx].toarray()[0])
            sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
            topic_terms[topic].update([term for term, score in sorted_scores[:10]])
        
        # 2. Extract key phrases using spaCy
        doc = nlp(' '.join(questions))
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 3:  # Limit phrase length
                topic_terms[topic].add(chunk.text.lower())
        
        # 3. Add individual words from topic name
        topic_words = set(word.lower() for word in topic.split() 
                         if len(word) > 2 and word.lower() not in nlp.Defaults.stop_words)
        topic_terms[topic].update(topic_words)
        
        # 4. Add key terms from questions
        for question in questions:
            doc = nlp(question)
            for token in doc:
                # Add nouns and technical terms
                if (token.pos_ in ['NOUN', 'PROPN'] and 
                    len(token.text) > 2 and 
                    token.text.lower() not in nlp.Defaults.stop_words):
                    topic_terms[topic].add(token.text.lower())
    
    return dict(topic_terms)

def get_topic_terms(dataset_path):
    global _topic_terms_cache
    if _topic_terms_cache is None:
        _topic_terms_cache = generate_topic_terms(dataset_path)
    return _topic_terms_cache

def calculate_similarity(question: str, terms: set) -> float:
    """
    Enhanced similarity calculation with better term matching
    """
    question = question.lower()
    question_words = set(question.split())
    
    # Special handling for "What is X?" questions
    if question.startswith('what is '):
        term = question[8:].rstrip('?.').strip()  # Extract the term being asked about
        
        # Print for debugging
        print(f"Checking term: '{term}' against terms: {terms}")
        
        # Direct term match
        if term in [t.lower() for t in terms]:
            print(f"Direct match found for: {term}")
            return 1.0
        
        # Check if term is part of any topic term
        for topic_term in terms:
            topic_term_lower = topic_term.lower()
            # Print for debugging
            print(f"Comparing '{term}' with topic term: '{topic_term_lower}'")
            
            if term == topic_term_lower or term in topic_term_lower.split():
                print(f"Match found: {term} in {topic_term_lower}")
                return 0.9
    
    # Regular similarity calculation
    exact_matches = sum(1 for term in terms if term.lower() in question)
    topic_keywords = sum(1 for term in terms 
                        if any(word in question_words 
                              for word in term.lower().split()))
    
    # Print for debugging
    print(f"Exact matches: {exact_matches}")
    print(f"Topic keywords: {topic_keywords}")
    
    if exact_matches > 0:
        similarity = exact_matches / len(terms) if terms else 0
    else:
        similarity = (topic_keywords / len(terms) * 0.5) if terms else 0
    
    print(f"Final similarity score: {similarity}")
    return min(similarity, 1.0)

def preprocess_question(question: str) -> str:
    """
    Preprocess question by removing punctuation and standardizing format
    """
    # Remove question marks and other punctuation at the end
    question = question.rstrip('?.!')
    return question

def predict_relevance(question: str, topic: str) -> float:
    """
    Predicts relevance using model prediction and term similarity
    """
    global model, tokenizer
    
    # Debug prints
    print("\nDEBUG - predict.py:")
    print(f"Question: {question}")
    print(f"Topic: {topic}")
    
    # Preprocess question
    question = question.lower().rstrip('?.!')
    
    # Get topic terms
    terms = get_topic_terms(dataset_path).get(topic, set())
    print(f"Topic terms: {terms}")
    
    # Prepare input text
    input_text = f"Question: {question} Topic: {topic}"
    inputs = tokenizer(
        input_text,
        padding="max_length",
        truncation=True,
        max_length=128,
        return_tensors="pt",
        return_token_type_ids=False
    )
    
    # Get model prediction
    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1)
        model_score = probabilities[0][1].item()
        print(f"Initial model score: {model_score}")
    
    try:
        # Calculate similarity score
        similarity_score = calculate_similarity(question, terms) if terms else 0.0
        print(f"Similarity score: {similarity_score}")
        
        # Calculate final score with weighted combination
        if similarity_score > 0.5:
            # High similarity suggests relevance
            final_score = max(model_score, 0.7)
        elif model_score < 0.1 and similarity_score < 0.1:
            # Both scores very low suggests irrelevance
            final_score = 0.0001
        else:
            # Balanced weighting otherwise
            final_score = (0.7 * model_score) + (0.3 * similarity_score)
            
        print(f"Final score: {final_score}")
        return final_score
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        return model_score

  # Convert to Python float
def update_predict_relevance():
    """
    Returns the current version of predict_relevance function
    """
    return predict_relevance

# Add test function
def test_prediction(question, topic):
    score = predict_relevance(question, topic)
    print(f"\nQuestion: {question}")
    print(f"Topic: {topic}")
    print(f"Relevance Score: {score:.4f}")
    print(f"Prediction: {'Relevant' if score >= 0.5 else 'Not Relevant'}")
    print(f"Confidence: {(score if score >= 0.5 else 1-score)*100:.2f}%")

if __name__ == "__main__":
    # Test cases
    test_cases = [
        ("What is cell?", "Biology"),
        ("What is photosynthesis?", "Biology"),
        ("How to make coffee?", "Biology"),
        ("What is quantum computing?", "Quantum Computing: The Next Frontier"),
        ("What is the capital of Japan?", "Cybersecurity Trends and Challenges")
    ]
    
    for question, topic in test_cases:
        test_prediction(question, topic)

