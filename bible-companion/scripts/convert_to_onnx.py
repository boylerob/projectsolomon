#!/usr/bin/env python3
"""
Script to convert TinyLlama model to ONNX format for React Native
"""

import os
import sys
import json
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
import onnx
import onnxruntime as ort

def convert_tinyllama_to_onnx():
    """Convert TinyLlama model to ONNX format"""
    print("🔄 Converting TinyLlama to ONNX format...")
    
    model_dir = Path("assets/models/tinyllama")
    if not model_dir.exists():
        print("❌ Model directory not found. Please run setup first.")
        return False
    
    try:
        # Load the model and tokenizer
        print("📥 Loading TinyLlama model...")
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        model = AutoModelForCausalLM.from_pretrained(
            str(model_dir),
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        )
        
        # Set model to evaluation mode
        model.eval()
        
        # Create a dummy input for ONNX conversion
        print("🔧 Creating dummy input for conversion...")
        dummy_input = tokenizer(
            "Hello, how are you?",
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        )
        
        # Convert to ONNX
        print("🔄 Converting to ONNX...")
        onnx_path = Path("assets/models/tinyllama_bible_refinement.onnx")
        
        torch.onnx.export(
            model,
            (dummy_input['input_ids'], dummy_input['attention_mask']),
            str(onnx_path),
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input_ids', 'attention_mask'],
            output_names=['logits'],
            dynamic_axes={
                'input_ids': {0: 'batch_size', 1: 'sequence_length'},
                'attention_mask': {0: 'batch_size', 1: 'sequence_length'},
                'logits': {0: 'batch_size', 1: 'sequence_length'}
            }
        )
        
        print(f"✅ Model converted to ONNX: {onnx_path}")
        
        # Update model info
        update_model_info(onnx_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting model: {e}")
        return False

def update_model_info(onnx_path: Path):
    """Update the ONNX model information"""
    print("📝 Updating model information...")
    
    # Get file size
    file_size = onnx_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)
    
    # Create model info
    model_info = {
        "model_name": "tinyllama_bible_refinement",
        "format": "onnx",
        "input_shape": [1, 512],
        "output_shape": [1, 512, 32000],  # vocab_size = 32000
        "file_size_mb": round(file_size_mb, 2),
        "status": "ready_for_inference",
        "conversion_date": str(Path().cwd()),
        "model_type": "clarification_refinement"
    }
    
    # Save model info
    info_path = Path("assets/models/onnx_model_info.json")
    with open(info_path, 'w') as f:
        json.dump(model_info, f, indent=2)
    
    print("✅ Model information updated")

def test_onnx_model():
    """Test the converted ONNX model"""
    print("🧪 Testing ONNX model...")
    
    onnx_path = Path("assets/models/tinyllama_bible_refinement.onnx")
    if not onnx_path.exists():
        print("❌ ONNX model not found")
        return False
    
    try:
        # Load ONNX model
        ort_session = ort.InferenceSession(str(onnx_path))
        
        # Test with dummy input
        dummy_input = {
            'input_ids': [[1, 2, 3, 4, 5]],  # Simple token sequence
            'attention_mask': [[1, 1, 1, 1, 1]]
        }
        
        # Run inference
        outputs = ort_session.run(None, dummy_input)
        
        print("✅ ONNX model test successful")
        print(f"Output shape: {outputs[0].shape}")
        
        return True
        
    except Exception as e:
        print(f"❌ ONNX model test failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting TinyLlama to ONNX conversion...")
    
    # Step 1: Convert model
    if not convert_tinyllama_to_onnx():
        print("❌ Conversion failed")
        return False
    
    # Step 2: Test model
    if not test_onnx_model():
        print("❌ Model test failed")
        return False
    
    print("🎉 TinyLlama to ONNX conversion complete!")
    print("\n📋 Next steps:")
    print("1. Update LocalLLMService to use ONNX model")
    print("2. Test clarification refinement in the app")
    print("3. Clear Metro cache: npx expo start --clear")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 