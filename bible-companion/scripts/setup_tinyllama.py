#!/usr/bin/env python3
"""
Setup script for TinyLlama integration with Bible Companion app.
Downloads and configures TinyLlama model for local inference.
"""

import os
import sys
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def setup_tinyllama():
    """Download and setup TinyLlama model."""
    
    # Model configuration
    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    model_dir = Path("assets/models/tinyllama")
    
    print(f"Setting up TinyLlama model: {model_name}")
    print(f"Model will be saved to: {model_dir.absolute()}")
    
    # Create model directory
    model_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        print("Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(model_dir)
        print("✓ Tokenizer downloaded and saved")
        
        print("Downloading model...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float32,  # Use float32 for CPU compatibility
            low_cpu_mem_usage=True,
            device_map="cpu"
        )
        model.save_pretrained(model_dir)
        print("✓ Model downloaded and saved")
        
        # Test the model
        print("Testing model...")
        test_input = "What is the meaning of John 3:16?"
        inputs = tokenizer(test_input, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_length=100,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"✓ Model test successful")
        print(f"Test input: {test_input}")
        print(f"Test output: {response[:100]}...")
        
        # Create model info file
        model_info = {
            "model_name": model_name,
            "model_type": "causal_lm",
            "framework": "pytorch",
            "device": "cpu",
            "dtype": "float32",
            "max_length": 2048,
            "temperature": 0.7,
            "top_p": 0.9,
            "description": "TinyLlama 1.1B Chat model for Bible Companion local inference"
        }
        
        import json
        with open(model_dir / "model_info.json", "w") as f:
            json.dump(model_info, f, indent=2)
        
        print("✓ Model info saved")
        print(f"\n🎉 TinyLlama setup complete!")
        print(f"Model location: {model_dir.absolute()}")
        print(f"Model size: {sum(f.stat().st_size for f in model_dir.rglob('*') if f.is_file()) / (1024**3):.2f} GB")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up TinyLlama: {e}")
        return False

def check_requirements():
    """Check if required packages are installed."""
    required_packages = ["torch", "transformers", "accelerate", "sentencepiece"]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them with: pip install " + " ".join(missing_packages))
        return False
    
    print("✓ All required packages are installed")
    return True

def main():
    """Main setup function."""
    print("🚀 TinyLlama Setup for Bible Companion")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Setup model
    if setup_tinyllama():
        print("\n✅ Setup completed successfully!")
        print("\nNext steps:")
        print("1. The model is now ready for use in the Bible Companion app")
        print("2. The LocalLLMService will automatically detect and load the model")
        print("3. Test the integration by asking a question in the app")
    else:
        print("\n❌ Setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 