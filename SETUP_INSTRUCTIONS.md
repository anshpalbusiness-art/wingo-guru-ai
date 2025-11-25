# WOLF AI - Wingo Prediction Setup Instructions

## How It Works

1. **Upload Screenshot**: Take a screenshot of your Wingo game history showing the round numbers and results
2. **OCR Processing**: The app uses Tesseract.js to extract numbers from your screenshot
3. **AI Analysis**: Extracted data is sent to the AI prediction engine
4. **Get Predictions**: Receive color (Red/Green/Violet) and size (Big/Small) predictions

## Wingo Color Rules

The app correctly implements these Wingo rules:
- **Red**: 2, 4, 6, 8 (even numbers except 0 and 5)
- **Green**: 1, 3, 7, 9 (odd numbers except 5)
- **Violet**: 0, 5 (special numbers)
- **Big**: 5, 6, 7, 8, 9
- **Small**: 0, 1, 2, 3, 4

## Setup Requirements

### 1. Supabase Edge Function Deployment

The prediction functionality requires deploying the Supabase edge function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref cavoujzntconrjfkqawi

# Deploy the edge function
supabase functions deploy wingo-predict

# Set the LOVABLE_API_KEY secret
supabase secrets set LOVABLE_API_KEY=your_api_key_here
```

### 2. Environment Variables

Make sure your `.env` file has these variables (already configured):
```
VITE_SUPABASE_PROJECT_ID="cavoujzntconrjfkqawi"
VITE_SUPABASE_PUBLISHABLE_KEY="your_key"
VITE_SUPABASE_URL="https://cavoujzntconrjfkqawi.supabase.co"
```

### 3. Get LOVABLE_API_KEY

You need a Lovable API key for the AI predictions:
1. Go to your Lovable dashboard
2. Navigate to API settings
3. Generate an API key
4. Set it as a Supabase secret (see command above)

## Testing the App

1. **Start the dev server** (already running):
   ```bash
   npm run dev
   ```

2. **Take a Wingo screenshot** showing:
   - Round numbers (e.g., 20241125010123)
   - Result numbers (0-9)
   - Make sure numbers are clear and readable

3. **Upload the screenshot**:
   - Click or drag & drop in the upload area
   - Wait for OCR processing (a few seconds)
   - AI will automatically analyze and predict

4. **View results**:
   - Round history appears on the right
   - Trend chart shows color patterns
   - AI prediction appears in the chat

## Troubleshooting

### OCR Not Detecting Numbers
- Ensure screenshot is clear and high resolution
- Numbers should be visible and not blurry
- Try cropping to show only the relevant game history area

### Prediction Fails
- Check that Supabase function is deployed
- Verify LOVABLE_API_KEY is set correctly
- Check browser console for detailed error messages
- Ensure you have API credits available

### No Data Extracted
- The app tries multiple pattern matching strategies
- If structured data isn't found, it extracts single digits
- Make sure at least some numbers (0-9) are visible in the screenshot

## Features

✅ **OCR Processing**: Automatic number extraction from screenshots
✅ **Pattern Analysis**: AI analyzes color streaks, big/small trends
✅ **Dual Predictions**: Both color AND size predictions
✅ **Confidence Scores**: Shows prediction confidence (60-95%)
✅ **Betting Suggestions**: Conservative/Moderate/Aggressive recommendations
✅ **Visual Analytics**: Charts and history display
✅ **Responsive Design**: Works on mobile and desktop

## Current Status

- ✅ Frontend working
- ✅ OCR implementation complete
- ✅ Color rules corrected
- ✅ Pattern matching improved
- ⚠️ Supabase function needs deployment
- ⚠️ LOVABLE_API_KEY needs to be configured

## Next Steps

1. Deploy the Supabase edge function
2. Configure the LOVABLE_API_KEY
3. Test with real Wingo screenshots
4. Adjust OCR patterns if needed based on your specific screenshot format
