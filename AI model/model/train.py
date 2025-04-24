from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
import torch
from datasets import Dataset
import pandas as pd
import spacy
from nltk.corpus import wordnet
import nltk
from sklearn.model_selection import train_test_split
import evaluate
import numpy as np
import os

# Download required NLTK data
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

def augment_training_data(questions, topics, labels):
    """
    Augment training data with better handling of basic questions
    """
    augmented_questions = []
    augmented_topics = []
    augmented_labels = []
    
    for question, topic, label in zip(questions, topics, labels):
        # Add original data
        augmented_questions.append(question)
        augmented_topics.append(topic)
        augmented_labels.append(label)
        
        if label == 1:  # Only augment relevant questions
            # Special handling for basic definition questions
            if question.lower().startswith('what is '):
                base_term = question[8:].rstrip('?').strip()  # Remove "What is " and "?"
                variations = [
                    f"What is {base_term}",
                    f"What is {base_term}?",
                    f"What's {base_term}",
                    f"What's {base_term}?",
                    f"Can you explain {base_term}",
                    f"Please explain {base_term}"
                ]
                for var in variations:
                    augmented_questions.append(var)
                    augmented_topics.append(topic)
                    augmented_labels.append(label)
            
            # Handle other question types
            elif question.lower().startswith(('how does', 'how do', 'how can')):
                # Keep original form and add question mark variation
                if not question.endswith('?'):
                    augmented_questions.append(question + '?')
                    augmented_topics.append(topic)
                    augmented_labels.append(label)
    
    return augmented_questions, augmented_topics, augmented_labels

def contrastive_loss(embeddings, labels, temperature=0.5):
    """
    Implement contrastive learning to help model learn better representations
    """
    similarity_matrix = torch.matmul(embeddings, embeddings.T)
    mask = (labels.unsqueeze(1) == labels.unsqueeze(0)).float()
    
    # Scaled pairwise cosine similarities
    similarity_matrix = similarity_matrix / temperature
    
    # Negative pairs
    negative_mask = 1 - mask
    
    # Contrastive loss
    exp_sim = torch.exp(similarity_matrix)
    log_prob = similarity_matrix - torch.log(exp_sim.sum(dim=1, keepdim=True))
    
    loss = (mask * log_prob).sum(dim=1) / mask.sum(dim=1)
    return -loss.mean()

def implement_curriculum(dataset):
    """
    Order training examples from easy to hard
    """
    difficulties = []
    for question, topic in dataset:
        # Calculate difficulty based on:
        # 1. Question length
        # 2. Vocabulary complexity
        # 3. Semantic similarity to topic
        difficulty_score = calculate_difficulty(question, topic)
        difficulties.append((question, topic, difficulty_score))
    
    # Sort by difficulty
    return sorted(difficulties, key=lambda x: x[2])

def calculate_difficulty(question: str, topic: str) -> float:
    """
    Calculate difficulty score for a question-topic pair
    
    Args:
        question (str): The question text
        topic (str): The topic text
        
    Returns:
        float: Difficulty score between 0 and 1 (higher = more difficult)
    """
    nlp = spacy.load('en_core_web_sm')
    
    # 1. Question length (longer questions might be more complex)
    length_score = min(len(question.split()) / 20, 1.0)  # Normalize by typical length
    
    # 2. Vocabulary complexity
    doc = nlp(question.lower())
    complex_words = 0
    total_words = 0
    
    for token in doc:
        if not token.is_punct and not token.is_space:
            total_words += 1
            # Consider a word complex if it's not in the most common English words
            if not token.is_stop and len(token.text) > 6:
                complex_words += 1
    
    vocab_score = complex_words / total_words if total_words > 0 else 0
    
    # 3. Semantic similarity to topic
    question_doc = nlp(question.lower())
    topic_doc = nlp(topic.lower())
    semantic_score = 1 - question_doc.similarity(topic_doc)  # Lower similarity = higher difficulty
    
    # Combine scores (weighted average)
    difficulty_score = (
        0.3 * length_score +      # Length contributes 30%
        0.4 * vocab_score +       # Vocabulary complexity contributes 40%
        0.3 * semantic_score      # Semantic distance contributes 30%
    )
    
    return difficulty_score

def compute_metrics(eval_pred):
    """
    Compute metrics for model evaluation using evaluate library
    """
    accuracy_metric = evaluate.load("accuracy")
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return accuracy_metric.compute(predictions=predictions, references=labels)

def train_model():
    # Load DistilBERT tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    model = AutoModelForSequenceClassification.from_pretrained(
        "distilbert-base-uncased",
        num_labels=2
    )
    
    # Load and preprocess dataset
    try:
        dataset_path = "utils/dataset.csv"
        df = pd.read_csv(dataset_path)
    except FileNotFoundError:
        alternate_paths = [
            "../utils/dataset.csv",
            "./dataset.csv",
            "../dataset.csv"
        ]
        
        for path in alternate_paths:
            try:
                df = pd.read_csv(path)
                print(f"Found dataset at: {path}")
                break
            except FileNotFoundError:
                continue
        else:
            raise FileNotFoundError("Could not find dataset.csv")

    # Split into train and validation sets
    train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)
    
    # Prepare input text and labels
    def prepare_data(df):
        texts = ["Question: " + q + " Topic: " + t for q, t in zip(df['question'], df['topic'])]
        labels = df['relevant'].astype(int).tolist()  # Convert relevant column to integers
        return texts, labels
    
    train_texts, train_labels = prepare_data(train_df)
    val_texts, val_labels = prepare_data(val_df)
    
    # Create datasets with both inputs and labels
    train_dataset = Dataset.from_dict({
        'text': train_texts,
        'label': train_labels
    })
    validation_dataset = Dataset.from_dict({
        'text': val_texts,
        'label': val_labels
    })
    
    def tokenize_function(examples):
        return tokenizer(
            examples['text'],
            padding="max_length",
            truncation=True,
            max_length=128
        )
    
    # Tokenize datasets
    tokenized_train_dataset = train_dataset.map(tokenize_function, batched=True)
    tokenized_validation_dataset = validation_dataset.map(tokenize_function, batched=True)
    
    # Make sure the datasets have the right format
    tokenized_train_dataset.set_format(
        type='torch', 
        columns=['input_ids', 'attention_mask', 'label']
    )
    tokenized_validation_dataset.set_format(
        type='torch', 
        columns=['input_ids', 'attention_mask', 'label']
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir="./model/relevance_model",
        num_train_epochs=8,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        warmup_ratio=0.1,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=100,
        eval_steps=100,
        evaluation_strategy="steps",
        save_strategy="steps",
        save_steps=500,
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        remove_unused_columns=True,
        learning_rate=3e-5,
        gradient_accumulation_steps=1
    )
    
    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train_dataset,
        eval_dataset=tokenized_validation_dataset,
        compute_metrics=compute_metrics,
    )
    
    # Train the model
    trainer.train()
    
    # Save the model
    output_dir = "./model/relevance_model"
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    # Verify save
    print(f"\nModel saved to: {output_dir}")
    print("Saved files:", os.listdir(output_dir))

if __name__ == "__main__":
    train_model()
