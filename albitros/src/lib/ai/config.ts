import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// OpenAI Configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic Configuration
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google AI Configuration
export const googleAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || ''
);

// AI Model Configurations
export const AI_MODELS = {
  // OpenAI Models
  GPT4_VISION: 'gpt-4-vision-preview',
  GPT4: 'gpt-4-turbo-preview',
  GPT3_5: 'gpt-3.5-turbo',
  
  // Anthropic Models
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  
  // Google Models
  GEMINI_PRO: 'gemini-pro',
  GEMINI_PRO_VISION: 'gemini-pro-vision',
};

// AI Service Settings
export const AI_SETTINGS = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.1, // Lower for more deterministic insurance decisions
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

// Risk Assessment Prompts
export const RISK_PROMPTS = {
  PROPERTY_ANALYSIS: `You are an expert insurance underwriter analyzing property risk. 
    Evaluate the property based on the provided data and return a risk score from 0-100 
    with detailed analysis of risk factors including flood, fire, crime, and structural risks.`,
  
  FRAUD_DETECTION: `You are a fraud detection specialist. Analyze the claim data 
    and identify potential fraud indicators. Return a fraud probability score and 
    explanation of suspicious patterns.`,
  
  DAMAGE_ASSESSMENT: `You are a property damage assessor. Analyze the provided 
    images and description to estimate repair costs and damage severity.`,
};