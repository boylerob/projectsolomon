#!/usr/bin/env python3
"""
Simplified script to convert TinyLlama to ONNX format for React Native
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
        
        # Add padding token if not present
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with CPU device map for ONNX conversion
        model = AutoModelForCausalLM.from_pretrained(
            str(model_dir),
            torch_dtype=torch.float32,  # Use float32 for ONNX compatibility
            low_cpu_mem_usage=True,
            device_map="cpu"  # Force CPU for ONNX conversion
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
        
        # Export with dynamic axes for flexible input sizes
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
            },
            verbose=False
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
        "model_type": "clarification_refinement",
        "description": "TinyLlama model converted to ONNX for biblical clarification refinement"
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

def create_simple_inference_script():
    """Create a simple inference script for testing"""
    print("📝 Creating simple inference script...")
    
    inference_script = '''#!/usr/bin/env python3
"""
Simple inference script for TinyLlama ONNX model
"""

import torch
import onnxruntime as ort
from transformers import AutoTokenizer
from pathlib import Path

def load_model():
    """Load the ONNX model and tokenizer"""
    model_path = Path("assets/models/tinyllama_bible_refinement.onnx")
    tokenizer_path = Path("assets/models/tinyllama")
    
    if not model_path.exists():
        print("❌ ONNX model not found")
        return None, None
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(str(tokenizer_path))
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load ONNX model
    ort_session = ort.InferenceSession(str(model_path))
    
    return ort_session, tokenizer

def generate_response(session, tokenizer, prompt, max_length=100):
    """Generate response using ONNX model"""
    # Tokenize input
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=512,
        truncation=True,
        padding=True
    )
    
    # Convert to numpy for ONNX
    input_ids = inputs['input_ids'].numpy()
    attention_mask = inputs['attention_mask'].numpy()
    
    # Run inference
    outputs = session.run(None, {
        'input_ids': input_ids,
        'attention_mask': attention_mask
    })
    
    # Get logits and generate response
    logits = outputs[0]
    
    # Simple greedy decoding
    next_token = logits[0, -1, :].argmax()
    generated_tokens = [next_token]
    
    # Generate more tokens
    for _ in range(max_length - 1):
        # Add the new token to input
        new_input_ids = input_ids.copy()
        new_input_ids[0] = list(input_ids[0]) + generated_tokens
        
        new_attention_mask = attention_mask.copy()
        new_attention_mask[0] = list(attention_mask[0]) + [1] * len(generated_tokens)
        
        # Pad if needed
        if len(new_input_ids[0]) > 512:
            new_input_ids[0] = new_input_ids[0][-512:]
            new_attention_mask[0] = new_attention_mask[0][-512:]
        
        # Run inference
        outputs = session.run(None, {
            'input_ids': new_input_ids,
            'attention_mask': new_attention_mask
        })
        
        logits = outputs[0]
        next_token = logits[0, -1, :].argmax()
        generated_tokens.append(next_token)
        
        # Stop if EOS token
        if next_token == tokenizer.eos_token_id:
            break
    
    # Decode response
    response = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    return response

def test_clarification_refinement():
    """Test clarification refinement functionality"""
    print("🧪 Testing clarification refinement...")
    
    session, tokenizer = load_model()
    if not session or not tokenizer:
        return False
    
    # Test cases
    test_cases = [
        {
            "name": "Focus Clarification",
            "prompt": "Original Question: What is the meaning of John 3:16?\\nOriginal Response: John 3:16 is one of the most famous verses in the Bible.\\nUser Clarification: Focus on the salvation aspect"
        },
        {
            "name": "Context Clarification", 
            "prompt": "Original Question: Explain the parable of the Good Samaritan\\nOriginal Response: The parable tells the story of a man who was beaten.\\nUser Clarification: In the context of modern society"
        }
    ]
    
    for test_case in test_cases:
        print(f"\\n--- {test_case['name']} ---")
        print(f"Input: {test_case['prompt']}")
        
        try:
            response = generate_response(session, tokenizer, test_case['prompt'])
            print(f"Response: {response}")
        except Exception as e:
            print(f"Error: {e}")
    
    return True

if __name__ == "__main__":
    test_clarification_refinement()
'''
    
    script_path = Path("scripts/test_onnx_inference.py")
    with open(script_path, 'w') as f:
        f.write(inference_script)
    
    # Make it executable
    os.chmod(script_path, 0o755)
    
    print("✅ Simple inference script created")

def main():
    """Main function"""
    print("🚀 Starting simplified TinyLlama to ONNX conversion...")
    
    # Step 1: Convert model
    if not convert_tinyllama_to_onnx():
        print("❌ Conversion failed")
        return False
    
    # Step 2: Test model
    if not test_onnx_model():
        print("❌ Model test failed")
        return False
    
    # Step 3: Create inference script
    create_simple_inference_script()
    
    print("🎉 TinyLlama to ONNX conversion complete!")
    print("\n📋 Next steps:")
    print("1. Test ONNX inference: python3 scripts/test_onnx_inference.py")
    print("2. Update LocalLLMService to use ONNX model")
    print("3. Test in the app")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 