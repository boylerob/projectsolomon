#!/usr/bin/env python3
"""
Script to download a fresh copy of TinyLlama from Hugging Face
"""

import os
import sys
import shutil
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM

def download_fresh_model():
    """Download fresh TinyLlama model from Hugging Face"""
    print("🔄 Downloading fresh TinyLlama model...")
    
    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    output_dir = Path("assets/models/tinyllama_fresh")
    
    try:
        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Download tokenizer
        print("📥 Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(str(output_dir))
        
        # Download model
        print("📥 Downloading model (this may take a while)...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype="auto",
            device_map="auto"
        )
        model.save_pretrained(str(output_dir))
        
        print(f"✅ Fresh model downloaded to {output_dir}")
        return str(output_dir)
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return None

def backup_old_model():
    """Backup the old corrupted model"""
    print("💾 Backing up old model...")
    
    old_dir = Path("assets/models/tinyllama")
    backup_dir = Path("assets/models/tinyllama_backup")
    
    if old_dir.exists():
        if backup_dir.exists():
            shutil.rmtree(backup_dir)
        shutil.move(str(old_dir), str(backup_dir))
        print(f"✅ Old model backed up to {backup_dir}")
    else:
        print("ℹ️ No old model to backup")

def replace_model():
    """Replace old model with fresh one"""
    print("🔄 Replacing model...")
    
    fresh_dir = Path("assets/models/tinyllama_fresh")
    target_dir = Path("assets/models/tinyllama")
    
    if fresh_dir.exists():
        if target_dir.exists():
            shutil.rmtree(target_dir)
        shutil.move(str(fresh_dir), str(target_dir))
        print(f"✅ Model replaced successfully")
        return True
    else:
        print("❌ Fresh model not found")
        return False

def test_model():
    """Test the fresh model"""
    print("🧪 Testing fresh model...")
    
    model_dir = Path("assets/models/tinyllama")
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            str(model_dir),
            torch_dtype="auto",
            device_map="auto"
        )
        
        # Test with a simple input
        test_input = "Hello, how are you?"
        inputs = tokenizer(test_input, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=50,
                temperature=0.7,
                do_sample=True
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print("✅ Model test successful!")
        print(f"Test response: {response}")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting fresh TinyLlama download...")
    
    # Step 1: Backup old model
    backup_old_model()
    
    # Step 2: Download fresh model
    model_path = download_fresh_model()
    if not model_path:
        print("❌ Failed to download fresh model")
        return False
    
    # Step 3: Replace model
    if not replace_model():
        print("❌ Failed to replace model")
        return False
    
    # Step 4: Test model
    if not test_model():
        print("❌ Model test failed")
        return False
    
    print("🎉 Fresh TinyLlama model ready!")
    print("\n📋 Next steps:")
    print("1. Run training: python3 scripts/train_tinyllama.py")
    print("2. Test clarification refinement")
    print("3. Convert to ONNX format")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 