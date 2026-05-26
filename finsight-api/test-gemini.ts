import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash';
  
  console.log('Testing with:');
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('Model ID:', modelId);

  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });

  try {
    const result = await model.generateContent('Say hello');
    console.log('Success:', result.response.text());
  } catch (error) {
    console.error('Failure:', error);
  }
}

test();
