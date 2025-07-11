# TinyLlama Integration for Bible Companion

## Overview

This document describes the TinyLlama integration for clarification refinement in the Bible Companion app. The system uses TinyLlama (1.1B parameters) to refine Gemini responses based on user clarifications.

## Architecture

```
User Question → Gemini → Full Response
                    ↓
User Clarification → TinyLlama → Refined Response
```

### Components

1. **LocalLLMService** (`src/services/LocalLLMService.ts`)
   - Handles TinyLlama model initialization
   - Processes clarifications to refine responses
   - Includes fallback logic when model isn't available

2. **Enhanced AgentService** (`src/services/AgentService.ts`)
   - Integrated with LocalLLMService
   - Detects clarification responses
   - Stores pending clarifications for refinement

3. **Training Data** (`assets/training_data/`)
   - 105 training examples for clarification refinement
   - Covers various biblical topics and clarification types

## Current Status

### ✅ Completed
- [x] Basic architecture implemented
- [x] LocalLLMService with fallback logic
- [x] Enhanced AgentService with clarification detection
- [x] Training data structure (105 examples)
- [x] Tokenizer downloaded
- [x] Model structure defined
- [x] React Native integration ready

### 🔄 In Progress
- [ ] PyTorch installation
- [ ] Full model download
- [ ] Model fine-tuning
- [ ] ONNX conversion

### 📋 Next Steps
- [ ] Install PyTorch: `pip3 install torch`
- [ ] Download full model: `python3 scripts/download_tinyllama.py`
- [ ] Fine-tune with training data
- [ ] Convert to ONNX format
- [ ] Update LocalLLMService to use actual model

## File Structure

```
bible-companion/
├── src/services/
│   ├── LocalLLMService.ts          # TinyLlama integration
│   └── AgentService.ts             # Enhanced with clarification handling
├── assets/
│   ├── models/
│   │   ├── tinyllama/              # Tokenizer and model files
│   │   ├── tinyllama_bible_refinement.onnx  # ONNX model (placeholder)
│   │   └── onnx_model_info.json    # Model metadata
│   └── training_data/
│       ├── tinyllama_training.json # Initial training data
│       └── enhanced_training_data.json # Extended training data
└── scripts/
    ├── download_tinyllama.py       # Full model download
    └── setup_tinyllama_simple.py   # Simplified setup
```

## Usage

### Testing the Current Implementation

1. **Start the app**: `cd bible-companion && npx expo start --clear`

2. **Test clarification flow**:
   - Ask: "What is the meaning of John 3:16?"
   - Wait for Gemini response
   - Clarify: "Focus on the salvation aspect"
   - System should refine the response

### Current Behavior

- **Fallback Mode**: When TinyLlama model isn't available, the system uses simple text refinement
- **Clarification Detection**: Automatically detects when user input is a clarification
- **Response Refinement**: Incorporates clarification into the original response

## Training Data

### Format
```json
{
  "instruction": "Refine the following biblical response with the user's clarification",
  "input": "Original Question: [question]\nOriginal Response: [response]\nUser Clarification: [clarification]",
  "output": "[refined_response]"
}
```

### Examples
- **Focus clarifications**: "Focus on the salvation aspect"
- **Context clarifications**: "In the context of modern society"
- **Personal clarifications**: "For someone who has been deeply hurt"
- **Explanatory clarifications**: "Explain more about God's love"

## Model Specifications

- **Model**: TinyLlama 1.1B-Chat-v1.0
- **Size**: ~1.1GB (quantized)
- **Architecture**: 22 layers, 32 heads, 2048 hidden size
- **Vocabulary**: 32,000 tokens
- **Format**: ONNX (for React Native compatibility)

## Performance Considerations

### Current (Fallback Mode)
- **Processing Time**: <100ms
- **Memory Usage**: Minimal
- **Quality**: Basic text refinement

### Target (Full Model)
- **Processing Time**: 2-5 seconds
- **Memory Usage**: ~500MB
- **Quality**: Sophisticated refinement

## Troubleshooting

### Common Issues

1. **"TinyLlama model not found"**
   - Solution: Run `python3 scripts/setup_tinyllama_simple.py`

2. **"Local LLM will be disabled"**
   - Solution: Check if tokenizer files exist in `assets/models/tinyllama/`

3. **Clarification not detected**
   - Solution: Check `isClarificationQuestion()` method in AgentService

### Development Commands

```bash
# Setup TinyLlama
python3 scripts/setup_tinyllama_simple.py

# Generate training data
python3 scripts/generate_training_data.py

# Clear Metro cache
cd bible-companion && npx expo start --clear
```

## Future Enhancements

1. **Model Fine-tuning**: Train TinyLlama specifically for biblical clarification
2. **Quantization**: Reduce model size for mobile deployment
3. **Progressive Download**: Allow users to download model optionally
4. **Offline Mode**: Full offline functionality with local model
5. **Performance Optimization**: Optimize inference speed

## Contributing

When adding new training examples:
1. Follow the established format
2. Include diverse clarification types
3. Test with the current fallback system
4. Update this documentation

## References

- [TinyLlama Paper](https://arxiv.org/abs/2401.02385)
- [ONNX Runtime React Native](https://github.com/microsoft/onnxruntime-react-native)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/) 