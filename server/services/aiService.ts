/**
 * AI Service for Image Analysis and Recommendations
 * Integrates with OpenAI Vision API and custom recommendation logic
 */

import OpenAI from 'openai';
import { db } from '../db';
import { aiAnalysis, orders } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { structuredLogger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageAnalysisResult {
  artworkType: string;
  dominantColors: string[];
  style: string;
  mood: string;
  complexity: 'simple' | 'medium' | 'complex';
  recommendedFrames: FrameRecommendation[];
  recommendedMats: MatRecommendation[];
  recommendedGlass: string;
  confidence: number;
}

export interface FrameRecommendation {
  style: string;
  reasoning: string;
  confidence: number;
}

export interface MatRecommendation {
  color: string;
  type: string;
  reasoning: string;
  confidence: number;
}

export class AIService {
  async analyzeArtworkImage(imageUrl: string, orderId: string): Promise<ImageAnalysisResult> {
    try {
      structuredLogger.info('Starting AI image analysis', { orderId, imageUrl });

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this artwork image for custom framing recommendations. Provide detailed analysis including:
                1. Artwork type (painting, photograph, print, drawing, etc.)
                2. Dominant colors (list 3-5 main colors)
                3. Artistic style (modern, traditional, abstract, realistic, etc.)
                4. Mood/feeling (warm, cool, energetic, calm, etc.)
                5. Complexity level for framing (simple, medium, complex)
                6. Frame style recommendations with reasoning
                7. Mat color recommendations with reasoning
                8. Glass type recommendation

                Format your response as JSON with the following structure:
                {
                  "artworkType": "string",
                  "dominantColors": ["color1", "color2", "color3"],
                  "style": "string",
                  "mood": "string",
                  "complexity": "simple|medium|complex",
                  "frameRecommendations": [
                    {"style": "string", "reasoning": "string", "confidence": 0.0-1.0}
                  ],
                  "matRecommendations": [
                    {"color": "string", "type": "string", "reasoning": "string", "confidence": 0.0-1.0}
                  ],
                  "glassRecommendation": "string",
                  "overallConfidence": 0.0-1.0
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis result from OpenAI');
      }

      // Parse the JSON response
      const analysisData = JSON.parse(analysisText);
      
      // Transform to our interface format
      const result: ImageAnalysisResult = {
        artworkType: analysisData.artworkType,
        dominantColors: analysisData.dominantColors,
        style: analysisData.style,
        mood: analysisData.mood,
        complexity: analysisData.complexity,
        recommendedFrames: analysisData.frameRecommendations.map((rec: any) => ({
          style: rec.style,
          reasoning: rec.reasoning,
          confidence: rec.confidence
        })),
        recommendedMats: analysisData.matRecommendations.map((rec: any) => ({
          color: rec.color,
          type: rec.type,
          reasoning: rec.reasoning,
          confidence: rec.confidence
        })),
        recommendedGlass: analysisData.glassRecommendation,
        confidence: analysisData.overallConfidence
      };

      // Store analysis in database
      await db.insert(aiAnalysis).values({
        orderId,
        imageUrl,
        analysisType: 'comprehensive_recommendation',
        results: result,
        confidence: result.confidence.toString(),
        processingTime: Date.now() - Date.now(), // This would be calculated properly
        modelVersion: 'gpt-4-vision-preview'
      });

      structuredLogger.info('AI analysis completed successfully', { 
        orderId, 
        confidence: result.confidence,
        artworkType: result.artworkType 
      });

      return result;

    } catch (error) {
      structuredLogger.error('AI image analysis failed', {
        error: error as Error,
        severity: 'high',
        orderId,
        imageUrl,
        integration: 'openai'
      });
      
      // Return fallback recommendations
      return this.getFallbackRecommendations();
    }
  }

  async getStyleRecommendations(artworkType: string, dominantColors: string[]): Promise<FrameRecommendation[]> {
    // Rule-based recommendations as fallback or supplement to AI
    const recommendations: FrameRecommendation[] = [];

    // Traditional artwork recommendations
    if (artworkType.toLowerCase().includes('painting') || artworkType.toLowerCase().includes('oil')) {
      recommendations.push({
        style: 'ornate-gold',
        reasoning: 'Traditional gold frames complement oil paintings and enhance their classical appeal',
        confidence: 0.8
      });
      recommendations.push({
        style: 'premium-wood',
        reasoning: 'Rich wood frames provide warmth and sophistication for traditional artwork',
        confidence: 0.7
      });
    }

    // Modern/contemporary recommendations
    if (artworkType.toLowerCase().includes('print') || artworkType.toLowerCase().includes('photograph')) {
      recommendations.push({
        style: 'contemporary',
        reasoning: 'Clean, modern frames enhance contemporary prints and photographs',
        confidence: 0.8
      });
      recommendations.push({
        style: 'metal-standard',
        reasoning: 'Metal frames provide a sleek, professional look for prints and photos',
        confidence: 0.7
      });
    }

    // Color-based recommendations
    const hasWarmColors = dominantColors.some(color => 
      ['red', 'orange', 'yellow', 'gold', 'brown'].some(warm => 
        color.toLowerCase().includes(warm)
      )
    );

    if (hasWarmColors) {
      recommendations.push({
        style: 'premium-wood',
        reasoning: 'Warm wood tones complement the warm colors in the artwork',
        confidence: 0.6
      });
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  private getFallbackRecommendations(): ImageAnalysisResult {
    return {
      artworkType: 'unknown',
      dominantColors: ['neutral'],
      style: 'contemporary',
      mood: 'neutral',
      complexity: 'medium',
      recommendedFrames: [
        {
          style: 'contemporary',
          reasoning: 'Versatile contemporary frame suitable for most artwork',
          confidence: 0.5
        }
      ],
      recommendedMats: [
        {
          color: 'white',
          type: 'conservation',
          reasoning: 'White conservation mat is a safe, professional choice',
          confidence: 0.5
        }
      ],
      recommendedGlass: 'uv-protection',
      confidence: 0.3
    };
  }

  async updateOrderWithAIRecommendations(orderId: string, recommendations: ImageAnalysisResult): Promise<void> {
    try {
      await db.update(orders)
        .set({
          aiRecommendations: recommendations,
          complexity: recommendations.complexity,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      structuredLogger.info('Updated order with AI recommendations', { orderId });
    } catch (error) {
      structuredLogger.error('Failed to update order with AI recommendations', {
        error: error as Error,
        severity: 'medium',
        orderId
      });
    }
  }
}

export const aiService = new AIService();