# Voice Prayer Partner Setup Guide

## 🎤 Overview

The Voice Prayer Partner is a revolutionary feature that allows users to have real-time voice conversations with an AI prayer guide. Instead of typing, users can speak naturally about their spiritual needs and receive vocal responses with prayer guidance.

## 🚀 Features

- **Real-time voice conversations** with sub-600ms response times
- **Natural speech recognition** using Deepgram
- **High-quality voice synthesis** using ElevenLabs
- **Context awareness** - knows what you're studying in the Bible
- **Personalized prayer guidance** based on your specific needs
- **Biblical wisdom integration** with relevant scripture references

## 📋 Prerequisites

1. **Vapi Account**: Sign up at [https://vapi.ai](https://vapi.ai)
2. **API Key**: Get your Vapi API key from the dashboard
3. **Microphone Permissions**: Ensure your app has microphone access

## 🔧 Setup Instructions

### Step 1: Vapi Account Setup

1. Go to [https://vapi.ai](https://vapi.ai)
2. Create a new account
3. Navigate to the dashboard
4. Get your API key from the settings

### Step 2: Configure Your Assistant

1. In the Vapi dashboard, create a new assistant
2. Use the system prompt from `src/config/vapi.ts`
3. Configure the assistant to connect to your Solomon API:
   - **API Endpoint**: `https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask`
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`
   - **Body**: 
     ```json
     {
       "prompt": "{{user_message}}",
       "contextLevel": "deep"
     }
     ```

### Step 3: Update Configuration

1. Open `src/config/vapi.ts`
2. Replace `'YOUR_VAPI_API_KEY'` with your actual Vapi API key
3. Save the file

### Step 4: Test the Integration

1. Run your app: `npm start`
2. Navigate to the Prayer section
3. Tap "Voice Prayer Partner"
4. Grant microphone permissions when prompted
5. Tap "Start Voice Prayer"
6. Speak naturally about your prayer needs

## 🎯 Usage Examples

### Example 1: Daily Prayer
**User**: "I need help starting my day with prayer"
**AI Response**: *"Good morning! Let's begin your day with gratitude. Heavenly Father, thank You for this new day and the gift of life..."*

### Example 2: Specific Need
**User**: "I'm struggling with anxiety about my job"
**AI Response**: *"I understand you're feeling anxious about work. Let me pray with you. Lord, we bring this anxiety before You..."*

### Example 3: Bible Study Integration
**User**: "I've been studying Genesis and need prayer about God's faithfulness"
**AI Response**: *"Since you've been studying Genesis, let's remember how God was faithful to Abraham, Isaac, and Jacob. Let me pray..."*

## 🔧 Technical Details

### Architecture
- **Frontend**: React Native with Vapi Web SDK
- **Voice Processing**: Deepgram for speech-to-text
- **AI Logic**: Your existing Solomon API
- **Voice Synthesis**: ElevenLabs for natural speech

### Event Flow
1. User taps "Start Voice Prayer"
2. Vapi initializes and requests microphone access
3. User speaks naturally
4. Deepgram transcribes speech to text
5. Text is sent to your Solomon API
6. AI response is synthesized by ElevenLabs
7. User hears the response through speakers

### Configuration Files
- `src/config/vapi.ts` - Vapi configuration
- `src/components/VoicePrayerPartner.tsx` - Voice interface component
- `src/screens/PrayerScreen.tsx` - Integration with Prayer screen

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to initialize voice connection"**
   - Check your Vapi API key
   - Ensure you have an active Vapi account

2. **"Failed to start voice session"**
   - Check microphone permissions
   - Ensure device has microphone access

3. **No audio response**
   - Check device volume
   - Ensure ElevenLabs voice is configured correctly

4. **Poor transcription quality**
   - Speak clearly and in a quiet environment
   - Check Deepgram configuration

### Debug Steps

1. Check console logs for error messages
2. Verify API key is correct
3. Test microphone permissions
4. Check network connectivity
5. Verify Vapi assistant configuration

## 🎨 Customization

### Voice Options
You can change the voice by updating the `voiceId` in `src/config/vapi.ts`:
- `pNInz6obpgDQGcFmaJgB` - Adam (warm and caring)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (clear and professional)
- `AZnzlk1XvdvUeBnXmlld` - Domi (friendly and approachable)

### System Prompt
Customize the AI's personality by modifying the `systemPrompt` in `src/config/vapi.ts`.

### UI Styling
Modify the styles in `VoicePrayerPartner.tsx` to match your app's design.

## 🔒 Privacy & Security

- All voice data is processed securely through Vapi
- No voice recordings are stored permanently
- Conversations are processed in real-time
- Your existing Solomon API security measures apply

## 📈 Future Enhancements

- **Voice Bible Reading**: "Read Genesis 1:1-5 to me"
- **Voice Meditation**: Guided voice meditation sessions
- **Voice Devotionals**: Interactive voice devotionals
- **Multi-language Support**: Voice prayer in different languages
- **Voice Prayer Journal**: Voice-to-text prayer journaling

## 🆘 Support

If you encounter issues:
1. Check the Vapi documentation: [https://docs.vapi.ai](https://docs.vapi.ai)
2. Review the troubleshooting section above
3. Check your Vapi dashboard for usage and error logs
4. Contact Vapi support for platform-specific issues

---

**Note**: The Voice Prayer Partner requires an active Vapi account and API key to function. The text-based Prayer Partner will continue to work without Vapi integration. 