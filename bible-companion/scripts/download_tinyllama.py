#!/usr/bin/env python3
"""
Script to download TinyLlama and convert it to ONNX format for React Native
"""

import os
import sys
import json
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
import onnx
import onnxruntime as ort

def download_tinyllama():
    """Download TinyLlama model and tokenizer"""
    print("🔄 Downloading TinyLlama model...")
    
    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    
    try:
        # Download tokenizer
        print("📥 Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Download model
        print("📥 Downloading model...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype="auto",
            device_map="auto"
        )
        
        # Save to local directory
        output_dir = Path("assets/models/tinyllama")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("💾 Saving model and tokenizer...")
        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)
        
        print(f"✅ Model saved to {output_dir}")
        return str(output_dir)
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return None

def create_simplified_model():
    """Create a simplified model for clarification refinement"""
    print("🔧 Creating simplified model for clarification refinement...")
    
    # This is a placeholder for the actual model conversion
    # In a real implementation, you would:
    # 1. Load the TinyLlama model
    # 2. Create a custom model that only handles clarification refinement
    # 3. Convert to ONNX format
    
    model_dir = Path("assets/models/tinyllama")
    if not model_dir.exists():
        print("❌ Model directory not found. Please run download_tinyllama() first.")
        return False
    
    # Create a simple ONNX model placeholder
    # This is just for demonstration - in practice you'd convert the actual model
    print("📝 Creating ONNX model placeholder...")
    
    # Create a simple model structure for clarification refinement
    model_structure = {
        "model_type": "clarification_refinement",
        "input_shape": [1, 512],  # Batch size, sequence length
        "output_shape": [1, 512],
        "vocab_size": 32000,
        "hidden_size": 2048,
        "num_layers": 22,
        "num_heads": 32
    }
    
    # Save model info
    model_info_path = Path("assets/models/tinyllama/model_info.json")
    with open(model_info_path, 'w') as f:
        json.dump(model_structure, f, indent=2)
    
    print("✅ Simplified model structure created")
    return True

def create_training_data_generator():
    """Create a script to generate more training data"""
    print("📊 Creating training data generator...")
    
    generator_script = '''#!/usr/bin/env python3
"""
Script to generate training data for TinyLlama clarification refinement
"""

import json
import random
from pathlib import Path

def generate_training_examples():
    """Generate synthetic training examples"""
    
    base_questions = [
        "What is the meaning of John 3:16?",
        "Explain the parable of the Good Samaritan",
        "What does the Bible say about forgiveness?",
        "How should Christians handle conflict?",
        "What is the significance of the cross?",
        "Explain the concept of grace",
        "What does the Bible say about prayer?",
        "How should we interpret the Old Testament?",
        "What is the role of the Holy Spirit?",
        "Explain the concept of salvation"
    ]
    
    clarifications = [
        "Focus on the salvation aspect",
        "In the context of modern society",
        "For someone who has been deeply hurt",
        "Explain more about God's love",
        "From a practical application perspective",
        "In terms of daily living",
        "For a beginner in faith",
        "With historical context",
        "In relation to other religions",
        "For someone struggling with doubt"
    ]
    
    training_data = []
    
    for question in base_questions:
        for clarification in clarifications:
            # Create synthetic refined response
            refined_response = f"Addressing your clarification about '{clarification}' in relation to '{question}': This aspect emphasizes the practical application and deeper meaning of the biblical teaching."
            
            training_example = {
                "instruction": "Refine the following biblical response with the user's clarification",
                "input": f"Original Question: {question}\\nOriginal Response: [Placeholder response]\\nUser Clarification: {clarification}",
                "output": refined_response
            }
            
            training_data.append(training_example)
    
    return training_data

if __name__ == "__main__":
    data = generate_training_examples()
    
    output_path = Path("assets/training_data/generated_training.json")
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Generated {len(data)} training examples")
'''
    
    generator_path = Path("scripts/generate_training_data.py")
    with open(generator_path, 'w') as f:
        f.write(generator_script)
    
    # Make it executable
    os.chmod(generator_path, 0o755)
    
    print("✅ Training data generator created")

def main():
    """Main function"""
    print("🚀 Starting TinyLlama setup...")
    
    # Create necessary directories
    Path("assets/models").mkdir(parents=True, exist_ok=True)
    Path("scripts").mkdir(exist_ok=True)
    
    # Step 1: Download model
    model_path = download_tinyllama()
    if not model_path:
        print("❌ Failed to download model")
        return False
    
    # Step 2: Create simplified model
    if not create_simplified_model():
        print("❌ Failed to create simplified model")
        return False
    
    # Step 3: Create training data generator
    create_training_data_generator()
    
    print("🎉 TinyLlama setup complete!")
    print("\n📋 Next steps:")
    print("1. Run: python3 scripts/generate_training_data.py")
    print("2. Fine-tune the model with your training data")
    print("3. Convert to ONNX format for React Native")
    print("4. Update LocalLLMService to use the actual model")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 