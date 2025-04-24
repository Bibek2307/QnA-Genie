# Question-Topic Relevance Prediction Model

This model predicts whether a given question is relevant to a specific topic using a combination of deep learning and NLP techniques.

## Architecture Overview

The system consists of four main components:
1. Training Pipeline (`train.py`)
2. Prediction Pipeline (`predict.py`)
3. API Interface (`app.py`)
4. Topic Terms Generator (`topic_terms.py`)

## Detailed Working Process

### 1. Training Pipeline (train.py)

#### Data Preparation
- Loads dataset from CSV containing questions, topics, and relevance labels
- Splits data into training (80%) and validation (20%) sets
- Augments training data using:
  - Synonym replacement (using WordNet)
  - Question reformulation (e.g., "what" → "could you explain")

#### Model Architecture
- Uses DistilBERT base model
- Fine-tuned for binary classification (relevant/not relevant)
- Input format: "Question: [question_text] Topic: [topic_text]"

#### Training Process
1. **Data Processing**
   - Tokenizes input text (max length: 128 tokens)
   - Converts labels to integers (0: not relevant, 1: relevant)

2. **Training Configuration**
   - Epochs: 5
   - Batch size: 8
   - Learning rate: Default with warmup
   - Weight decay: 0.01

3. **Training Features**
   - Curriculum learning (easier examples first)
   - Contrastive learning for better representations
   - Evaluation during training
   - Best model checkpoint saving

### 2. Prediction Pipeline (predict.py)

#### Prediction Process
1. **Model Loading**
   ```python
   relevance_score = model(tokenized_input).logits
   probability = softmax(relevance_score)
   ```

2. **Topic Terms Matching**
   ```python
   similarity_score = calculate_similarity(question, topic_terms)
   ```

3. **Final Score Calculation**
   ```python
   final_score = (0.8 * model_score) + (0.2 * similarity_score)
   ```

#### Similarity Calculation
- Exact matches: Full term found in question
- Partial matches: Words from term found in question
- Weighted combination of both

### 3. Topic Terms Generation

The system generates relevant terms for each topic using multiple NLP techniques:

1. **TF-IDF Analysis**
   ```python
   tfidf_matrix = tfidf.fit_transform(questions)
   top_terms = sort_by_score(tfidf_matrix)
   ```

2. **Key Phrase Extraction**
   - Uses spaCy for noun chunk extraction
   - Filters by phrase length and relevance

3. **Word2Vec Similarity**
   - Trains Word2Vec on domain-specific corpus
   - Finds semantically similar terms

### 4. API Interface (app.py)

Provides REST API endpoints:
- GET `/`: Health check
- POST `/predict`: Prediction endpoint
  ```json
  {
    "question": "question text",
    "topic": "topic name"
  }
  ```

Response format: 

## Detailed Scoring Process

### 1. Model Score

The model calculates the initial relevance score through these steps:

```python
# 1. Prepare input
input_text = f"Question: {question} Topic: {topic}"

# 2. Tokenize
inputs = tokenizer(
    input_text,
    padding="max_length",
    truncation=True,
    max_length=128,
    return_tensors="pt",
    return_token_type_ids=False
)

# 3. Get model prediction
with torch.no_grad():
    outputs = model(**inputs)
    probabilities = torch.softmax(outputs.logits, dim=1)
    model_score = probabilities[0][1].item()
```

### 2. Enhanced Similarity Score

The new similarity calculation is more sophisticated and handles special cases:

```python
def calculate_similarity(question: str, terms: set) -> float:
    question = question.lower()
    question_words = set(question.split())
    
    # Special handling for "What is X?" questions
    if question.startswith('what is '):
        term = question[8:].rstrip('?.').strip()
        
        # Direct term match
        if term in [t.lower() for t in terms]:
            return 1.0
            
        # Check if term is part of any topic term
        for topic_term in terms:
            if term == topic_term.lower() or term in topic_term.lower().split():
                return 0.9
    
    # Regular similarity calculation
    exact_matches = sum(1 for term in terms if term.lower() in question)
    topic_keywords = sum(1 for term in terms 
                        if any(word in question_words 
                              for word in term.lower().split()))
    
    if exact_matches > 0:
        similarity = exact_matches / len(terms) if terms else 0
    else:
        similarity = (topic_keywords / len(terms) * 0.5) if terms else 0
        
    return min(similarity, 1.0)
```

### 3. Final Score Calculation

The new scoring system uses a dynamic weighting approach based on similarity:

```python
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
```

Key features of the new scoring system:
1. Strong term matches can override model uncertainty
2. Very low scores in both metrics result in definitive irrelevance
3. Default weighting favors model prediction (70%) over term matching (30%)

### 4. Topic Terms Generation

The system now uses multiple techniques to generate relevant terms:

1. **TF-IDF Analysis with Enhanced Parameters**
```python
tfidf = TfidfVectorizer(
    stop_words='english', 
    ngram_range=(1, 3),  # Allow phrases up to 3 words
    min_df=1,
    max_features=50
)
```

2. **SpaCy-based Key Phrase Extraction**
```python
# Extract noun chunks
for chunk in doc.noun_chunks:
    if len(chunk.text.split()) <= 3:
        topic_terms[topic].add(chunk.text.lower())
```

3. **Topic Name Analysis**
```python
# Add individual words from topic name
topic_words = set(word.lower() for word in topic.split() 
                 if len(word) > 2 and word.lower() not in nlp.Defaults.stop_words)
```

4. **Technical Term Extraction**
```python
# Add nouns and technical terms from questions
if (token.pos_ in ['NOUN', 'PROPN'] and 
    len(token.text) > 2 and 
    token.text.lower() not in nlp.Defaults.stop_words):
    topic_terms[topic].add(token.text.lower())
```

### 5. Example Results

```json
{
    "result": "Relevant",
    "score": 0.7234,
    "similarity_score": 0.8,
    "model_score": 0.6999,
    "question": "What is quantum computing?",
    "topic": "Quantum Computing: The Next Frontier",
    "matched_terms": ["quantum", "computing"]
}
```

### 6. Factors Affecting Scores

1. **Model Score Influences**:
   - Question phrasing
   - Topic relevance in training data
   - Semantic understanding
   - Context recognition

2. **Similarity Score Influences**:
   - Number of matching terms
   - Quality of topic terms
   - Word overlap
   - Partial matches

3. **Weight Distribution (80/20)**:
   - Model gets higher weight (0.8) because it understands context
   - Similarity gets lower weight (0.2) as it's more basic matching