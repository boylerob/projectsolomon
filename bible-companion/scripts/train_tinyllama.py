#!/usr/bin/env python3
"""
Script to fine-tune TinyLlama for biblical clarification refinement
"""

import os
import sys
import json
import torch
from pathlib import Path
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
import numpy as np

def load_training_data():
    """Load and prepare training data"""
    print("📊 Loading training data...")
    
    training_file = Path("assets/training_data/enhanced_training_data.json")
    if not training_file.exists():
        print(f"❌ Training data not found: {training_file}")
        return None
    
    with open(training_file, 'r') as f:
        data = json.load(f)
    
    print(f"✅ Loaded {len(data)} training examples")
    return data

def prepare_dataset(data):
    """Prepare dataset for training"""
    print("🔧 Preparing dataset...")
    
    # Format data for instruction fine-tuning
    formatted_data = []
    
    for item in data:
        # Create the input text in the format TinyLlama expects
        input_text = f"<|im_start|>system\nYou are a helpful AI assistant that refines biblical responses based on user clarifications.<|im_end|>\n<|im_start|>user\n{item['input']}<|im_end|>\n<|im_start|>assistant\n{item['output']}<|im_end|>"
        
        formatted_data.append({
            "text": input_text,
            "instruction": item["instruction"],
            "input": item["input"],
            "output": item["output"]
        })
    
    # Create dataset
    dataset = Dataset.from_list(formatted_data)
    
    print(f"✅ Dataset prepared with {len(dataset)} examples")
    return dataset

def tokenize_dataset(dataset, tokenizer):
    """Tokenize the dataset"""
    print("🔤 Tokenizing dataset...")
    
    def tokenize_function(examples):
        # Tokenize the text
        tokenized = tokenizer(
            examples["text"],
            truncation=True,
            padding=True,  # Enable dynamic padding
            max_length=1024,
            return_tensors=None
        )
        
        # Set labels to input_ids for causal language modeling
        tokenized["labels"] = tokenized["input_ids"].copy()
        
        return tokenized
    
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names
    )
    
    print("✅ Dataset tokenized")
    return tokenized_dataset

def setup_model_and_tokenizer():
    """Setup model and tokenizer"""
    print("🤖 Setting up model and tokenizer...")
    
    model_dir = Path("assets/models/tinyllama")
    if not model_dir.exists():
        print("❌ Model directory not found. Please run setup first.")
        return None, None
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        
        # Add padding token if not present
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            str(model_dir),
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            device_map="auto"
        )
        
        print("✅ Model and tokenizer loaded successfully")
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None

def setup_lora_config():
    """Setup LoRA configuration for efficient fine-tuning"""
    print("🎯 Setting up LoRA configuration...")
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        inference_mode=False,
        r=16,  # Rank
        lora_alpha=32,  # Alpha parameter
        lora_dropout=0.1,  # Dropout probability
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    
    print("✅ LoRA configuration ready")
    return lora_config

def train_model(model, tokenizer, dataset, lora_config):
    """Train the model"""
    print("🚀 Starting model training...")
    
    # Apply LoRA
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Setup training arguments
    training_args = TrainingArguments(
        output_dir="./tinyllama_bible_refinement",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=100,
        learning_rate=2e-4,
        fp16=False,  # Set to False for CPU training
        logging_steps=10,
        save_steps=500,
        eval_steps=500,
        report_to=None,  # Disable wandb
        remove_unused_columns=False,
    )
    
    # Setup data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
        pad_to_multiple_of=8,  # For efficient tensorization
    )
    
    # Split dataset for evaluation
    dataset_dict = dataset.train_test_split(test_size=0.1)
    
    # Setup trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset_dict["train"],
        eval_dataset=dataset_dict["test"],
        data_collator=data_collator,
        tokenizer=tokenizer,
    )
    
    # Train the model
    print("🔥 Training started...")
    trainer.train()
    
    # Save the model
    output_dir = Path("assets/models/tinyllama_bible_refinement")
    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    
    print(f"✅ Model saved to {output_dir}")
    return output_dir

def test_trained_model(model_path, tokenizer):
    """Test the trained model"""
    print("🧪 Testing trained model...")
    
    # Load the trained model
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    # Test with a sample input
    test_input = """<|im_start|>system
You are a helpful AI assistant that refines biblical responses based on user clarifications.<|im_end|>
<|im_start|>user
Original Question: What is the meaning of John 3:16?
Original Response: John 3:16 is one of the most famous verses in the Bible. It states: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' This verse summarizes the core message of the Gospel - God's love for humanity and the gift of salvation through faith in Jesus Christ.
User Clarification: Focus on the salvation aspect<|im_end|>
<|im_start|>assistant"""
    
    inputs = tokenizer(test_input, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=200,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print("Test Response:")
    print(response)
    
    print("✅ Model test completed")

def main():
    """Main function"""
    print("🚀 Starting TinyLlama fine-tuning for biblical clarification...")
    
    # Step 1: Load training data
    data = load_training_data()
    if not data:
        return False
    
    # Step 2: Setup model and tokenizer
    model, tokenizer = setup_model_and_tokenizer()
    if not model or not tokenizer:
        return False
    
    # Step 3: Prepare dataset
    dataset = prepare_dataset(data)
    tokenized_dataset = tokenize_dataset(dataset, tokenizer)
    
    # Step 4: Setup LoRA
    lora_config = setup_lora_config()
    
    # Step 5: Train model
    model_path = train_model(model, tokenizer, tokenized_dataset, lora_config)
    if not model_path:
        return False
    
    # Step 6: Test model
    test_trained_model(model_path, tokenizer)
    
    print("🎉 TinyLlama fine-tuning complete!")
    print(f"\n📁 Model saved to: {model_path}")
    print("\n📋 Next steps:")
    print("1. Test the model in the app")
    print("2. Convert to ONNX format if needed")
    print("3. Update LocalLLMService to use the fine-tuned model")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 