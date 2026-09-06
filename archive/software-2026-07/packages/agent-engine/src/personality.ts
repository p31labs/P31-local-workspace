/**
 * P31 Agent Engine - Personality Engine
 * 
 * Core personality system for AI agents with mood management,
 * trait adaptation, and P31-specific neurodiversity awareness
 */

import { PersonalityMatrix, MoodState, MoodTrigger, MoodModifier, ModifierCondition, CommunicationStyle } from './types';
import { v4 as uuidv4 } from 'uuid';

export class PersonalityEngine {
  private personality: PersonalityMatrix;
  private moodHistory: MoodState[] = [];
  private interactionHistory: InteractionRecord[] = [];

  constructor(initialPersonality?: Partial<PersonalityMatrix>) {
    this.personality = this.createDefaultPersonality(initialPersonality);
  }

  /**
   * Create a default personality matrix with P31-specific traits
   */
  private createDefaultPersonality(customTraits?: Partial<PersonalityMatrix>): PersonalityMatrix {
    const defaultPersonality: PersonalityMatrix = {
      // Big Five Personality Traits (0-100 scale)
      extraversion: 50,
      neuroticism: 30,
      openness: 70,
      agreeableness: 60,
      conscientiousness: 65,
      
      // P31-Specific Traits
      neurodiversityAwareness: 80,
      spoonSensitivity: 75,
      technicalAptitude: 70,
      creativity: 85,
      empathy: 75,
      
      // Behavioral Modifiers
      learningRate: 50,
      adaptationSpeed: 40,
      emotionalRegulation: 60,
      communicationStyle: 'friendly',
      
      // Mood System
      currentMood: {
        type: 'calm',
        intensity: 50,
        duration: 300000, // 5 minutes default
        timestamp: new Date(),
      },
      moodTriggers: [],
      moodModifiers: [],
    };

    return { ...defaultPersonality, ...customTraits };
  }

  /**
   * Get current personality state
   */
  getPersonality(): PersonalityMatrix {
    return { ...this.personality };
  }

  /**
   * Update personality traits based on user feedback and interactions
   */
  updatePersonality(feedback: PersonalityFeedback): void {
    const { trait, value, intensity, context } = feedback;
    
    // Apply trait modification with learning rate consideration
    const currentTraitValue = this.personality[trait as keyof PersonalityMatrix] as number;
    const learningFactor = this.personality.learningRate / 100;
    const adaptationFactor = this.personality.adaptationSpeed / 100;
    
    // Calculate new value with bounds checking
    const newValue = Math.max(0, Math.min(100, currentTraitValue + (value * learningFactor * adaptationFactor)));
    
    // Update the trait
    (this.personality[trait as keyof PersonalityMatrix] as number) = newValue;
    
    // Log the change for tracking
    this.logPersonalityChange(trait, currentTraitValue, newValue, context);
  }

  /**
   * Process user input to determine mood changes
   */
  processUserInput(input: string, userMood?: string): MoodState {
    const currentMood = this.personality.currentMood;
    let newMood = { ...currentMood };
    
    // Analyze input for mood triggers
    const detectedMood = this.analyzeInputMood(input, userMood);
    
    if (detectedMood) {
      newMood = this.applyMoodChange(detectedMood, input);
    }
    
    // Apply mood modifiers based on context
    newMood = this.applyMoodModifiers(newMood, input);
    
    // Update current mood
    this.personality.currentMood = newMood;
    this.moodHistory.push(newMood);
    
    return newMood;
  }

  /**
   * Analyze user input to detect mood indicators
   */
  private analyzeInputMood(input: string, userMood?: string): MoodState | null {
    const lowerInput = input.toLowerCase();
    const now = new Date();
    
    // Check for explicit mood indicators in user input
    if (userMood) {
      return this.createMoodState(userMood as any, 70, 300000, now);
    }
    
    // Analyze text for mood indicators
    const moodIndicators = {
      happy: ['happy', 'great', 'awesome', 'wonderful', 'excellent', 'fantastic'],
      sad: ['sad', 'upset', 'depressed', 'unhappy', 'terrible', 'awful'],
      angry: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated'],
      calm: ['calm', 'peaceful', 'relaxed', 'chill', 'easygoing', 'content'],
      excited: ['excited', 'thrilled', 'pumped', 'energized', 'enthusiastic'],
      tired: ['tired', 'exhausted', 'sleepy', 'fatigued', 'drained', 'weary'],
      anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'anxious'],
      focused: ['focused', 'concentrated', 'determined', 'motivated', 'driven'],
    };

    for (const [moodType, indicators] of Object.entries(moodIndicators)) {
      const foundIndicator = indicators.find(indicator => lowerInput.includes(indicator));
      if (foundIndicator) {
        const intensity = this.calculateMoodIntensity(lowerInput, foundIndicator);
        return this.createMoodState(moodType as any, intensity, 300000, now);
      }
    }

    return null;
  }

  /**
   * Calculate mood intensity based on input analysis
   */
  private calculateMoodIntensity(input: string, indicator: string): number {
    // Base intensity
    let intensity = 50;
    
    // Boost intensity for multiple indicators or strong language
    const indicatorCount = (input.match(new RegExp(indicator, 'g')) || []).length;
    intensity += indicatorCount * 10;
    
    // Check for intensifiers
    const intensifiers = ['very', 'really', 'so', 'extremely', 'incredibly', 'absolutely'];
    const hasIntensifier = intensifiers.some(intensifier => input.includes(intensifier));
    if (hasIntensifier) {
      intensity += 20;
    }
    
    // Check for exclamation marks
    const exclamationCount = (input.match(/!/g) || []).length;
    intensity += exclamationCount * 5;
    
    // Check for question marks (uncertainty)
    const questionCount = (input.match(/\?/g) || []).length;
    if (questionCount > 0) {
      intensity -= questionCount * 5;
    }
    
    return Math.max(10, Math.min(90, intensity));
  }

  /**
   * Apply mood change with personality modifiers
   */
  private applyMoodChange(detectedMood: MoodState, input: string): MoodState {
    const emotionalRegulation = this.personality.emotionalRegulation;
    const neuroticism = this.personality.neuroticism;
    
    // Adjust intensity based on emotional regulation
    let adjustedIntensity = detectedMood.intensity;
    
    // High emotional regulation reduces mood swings
    if (emotionalRegulation > 70) {
      adjustedIntensity = adjustedIntensity * 0.7;
    } else if (emotionalRegulation < 30) {
      adjustedIntensity = adjustedIntensity * 1.3;
    }
    
    // High neuroticism amplifies negative moods
    if (detectedMood.type === 'sad' || detectedMood.type === 'angry' || detectedMood.type === 'anxious') {
      if (neuroticism > 70) {
        adjustedIntensity = adjustedIntensity * 1.2;
      }
    }
    
    // High openness and agreeableness can buffer negative moods
    const bufferingFactor = (this.personality.openness + this.personality.agreeableness) / 200;
    if (detectedMood.type === 'sad' || detectedMood.type === 'angry') {
      adjustedIntensity = adjustedIntensity * (1 - (bufferingFactor * 0.2));
    }
    
    return {
      ...detectedMood,
      intensity: Math.max(10, Math.min(90, adjustedIntensity)),
      timestamp: new Date(),
    };
  }

  /**
   * Apply mood modifiers based on context and personality
   */
  private applyMoodModifiers(currentMood: MoodState, input: string): MoodState {
    let mood = { ...currentMood };
    
    // Apply time-based modifiers
    const hours = new Date().getHours();
    if (hours >= 6 && hours <= 9) {
      // Morning boost
      mood.intensity += 10;
    } else if (hours >= 14 && hours <= 16) {
      // Afternoon dip
      mood.intensity -= 5;
    } else if (hours >= 22 || hours <= 4) {
      // Late night fatigue
      mood.intensity -= 15;
      if (mood.type === 'calm') mood.type = 'tired';
    }
    
    // Apply P31-specific modifiers
    const spoonSensitivity = this.personality.spoonSensitivity;
    const technicalTerms = ['algorithm', 'function', 'variable', 'class', 'interface', 'API', 'database', 'server'];
    const hasTechnicalTerms = technicalTerms.some(term => input.toLowerCase().includes(term));
    
    if (spoonSensitivity > 80 && hasTechnicalTerms) {
      // High spoon sensitivity reduces tolerance for complexity
      if (mood.type === 'focused') {
        mood.intensity -= 20;
        mood.type = 'anxious';
      }
    }
    
    // Apply neurodiversity awareness modifiers
    const neurodiversityAwareness = this.personality.neurodiversityAwareness;
    if (neurodiversityAwareness > 80) {
      // High awareness helps recognize and adapt to user needs
      const overwhelmedIndicators = ['overwhelmed', 'too much', 'confused', 'lost', 'can\'t focus'];
      const isOverwhelmed = overwhelmedIndicators.some(indicator => input.toLowerCase().includes(indicator));
      
      if (isOverwhelmed) {
        mood.type = 'calm';
        mood.intensity = 70;
      }
    }
    
    return mood;
  }

  /**
   * Create a mood state object
   */
  private createMoodState(type: any, intensity: number, duration: number, timestamp: Date): MoodState {
    return {
      type,
      intensity: Math.max(10, Math.min(90, intensity)),
      duration,
      timestamp,
    };
  }

  /**
   * Get appropriate response style based on current personality and mood
   */
  getResponseStyle(): ResponseStyle {
    const { currentMood, communicationStyle, extraversion, empathy } = this.personality;
    
    const style: ResponseStyle = {
      tone: this.calculateTone(currentMood, communicationStyle),
      complexity: this.calculateComplexity(currentMood, empathy),
      length: this.calculateLength(currentMood, extraversion),
      empathyLevel: this.calculateEmpathy(currentMood, empathy),
      technicalLevel: this.calculateTechnicalLevel(currentMood),
    };
    
    return style;
  }

  /**
   * Calculate appropriate tone based on mood and personality
   */
  private calculateTone(currentMood: MoodState, communicationStyle: CommunicationStyle): Tone {
    if (currentMood.type === 'angry' || currentMood.type === 'anxious') {
      return 'calm';
    } else if (currentMood.type === 'happy' || currentMood.type === 'excited') {
      return 'enthusiastic';
    } else if (currentMood.type === 'sad' || currentMood.type === 'tired') {
      return 'gentle';
    } else if (currentMood.type === 'focused') {
      return 'professional';
    }
    
      // Default based on communication style
    switch (communicationStyle) {
      case 'formal': return 'professional';
      case 'casual': return 'warm';
      case 'professional': return 'professional';
      case 'friendly': return 'warm';
      case 'technical': return 'precise';
      case 'creative': return 'expressive';
      case 'minimalist': return 'concise';
      default: return 'neutral' as Tone;
    }
  }

  /**
   * Calculate response complexity based on mood and empathy
   */
  private calculateComplexity(currentMood: MoodState, empathy: number): Complexity {
    if (currentMood.type === 'anxious') {
      return 'simple';
    } else if (currentMood.type === 'focused' && empathy > 70) {
      return 'detailed';
    } else if (currentMood.type === 'tired') {
      return 'simple';
    }
    
    return empathy > 70 ? 'balanced' : 'direct';
  }

  /**
   * Calculate response length based on mood and extraversion
   */
  private calculateLength(currentMood: MoodState, extraversion: number): Length {
    if (currentMood.type === 'tired' || currentMood.type === 'anxious') {
      return 'short';
    } else if (currentMood.type === 'excited' && extraversion > 70) {
      return 'long';
    }
    
    return extraversion > 70 ? 'medium' : 'short';
  }

  /**
   * Calculate empathy level based on mood and trait
   */
  private calculateEmpathy(currentMood: MoodState, empathy: number): number {
    let baseEmpathy = empathy;
    
    // Mood modifiers
    if (currentMood.type === 'angry' || currentMood.type === 'anxious') {
      baseEmpathy -= 20;
    } else if (currentMood.type === 'happy' || currentMood.type === 'calm') {
      baseEmpathy += 10;
    } else if (currentMood.type === 'sad') {
      baseEmpathy += 15;
    }
    
    return Math.max(0, Math.min(100, baseEmpathy));
  }

  /**
   * Calculate technical level based on mood and traits
   */
  private calculateTechnicalLevel(currentMood: MoodState): number {
    const { technicalAptitude, openness, currentMood: mood } = this.personality;
    
    let technicalLevel = technicalAptitude;
    
    // Mood modifiers
    if (mood.type === 'focused') {
      technicalLevel += 20;
    } else if (mood.type === 'tired' || mood.type === 'anxious') {
      technicalLevel -= 20;
    } else if (mood.type === 'happy') {
      technicalLevel += 10;
    }
    
    // Openness modifier
    technicalLevel += (openness - 50) * 0.2;
    
    return Math.max(10, Math.min(90, technicalLevel));
  }

  /**
   * Generate agent response considering personality and mood
   */
  generateResponse(input: string, context: ResponseContext): string {
    const style = this.getResponseStyle();
    const mood = this.personality.currentMood;
    
    // Apply style modifiers to response
    let response = this.createBaseResponse(input, context);
    
    // Apply tone
    response = this.applyTone(response, style.tone);
    
    // Apply complexity
    response = this.applyComplexity(response, style.complexity);
    
    // Apply length constraints
    response = this.applyLength(response, style.length);
    
    // Add mood-appropriate elements
    response = this.addMoodElements(response, mood);
    
    return response;
  }

  /**
   * Create base response
   */
  private createBaseResponse(input: string, context: ResponseContext): string {
    // This would integrate with your existing AI chat system
    // For now, return a placeholder
    return "I understand. Let me help you with that.";
  }

  /**
   * Apply tone to response
   */
  private applyTone(response: string, tone: Tone): string {
    switch (tone) {
      case 'calm':
        return `I understand. ${response}`;
      case 'enthusiastic':
        return `Great question! ${response}`;
      case 'gentle':
        return `I'm here to help. ${response}`;
      case 'professional':
        return `Based on your input, ${response}`;
      case 'warm':
        return `Sure thing! ${response}`;
      case 'precise':
        return `Analysis complete: ${response}`;
      case 'expressive':
        return `Fascinating! ${response}`;
      case 'concise':
        return response;
      default:
        return response;
    }
  }

  /**
   * Apply complexity to response
   */
  private applyComplexity(response: string, complexity: Complexity): string {
    // Simplify or elaborate based on complexity level
    if (complexity === 'simple') {
      return response.split('.').slice(0, 2).join('.') + '.';
    } else if (complexity === 'detailed') {
      return response + " Let me explain this in more detail...";
    }
    return response;
  }

  /**
   * Apply length constraints
   */
  private applyLength(response: string, length: Length): string {
    const words = response.split(' ');
    
    switch (length) {
      case 'short':
        return words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
      case 'long':
        return response + " Additionally, there are several other factors to consider...";
      default:
        return words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');
    }
  }

  /**
   * Add mood-appropriate elements
   */
  private addMoodElements(response: string, mood: MoodState): string {
    switch (mood.type) {
      case 'happy':
        return response + " 😊";
      case 'excited':
        return response + " 🚀";
      case 'calm':
        return response + " 🧘‍♂️";
      case 'focused':
        return response + " 🎯";
      case 'anxious':
        return response + " (Let's take this step by step)";
      default:
        return response;
    }
  }

  /**
   * Log personality changes for tracking
   */
  private logPersonalityChange(trait: string, oldValue: number, newValue: number, context: string): void {
    this.interactionHistory.push({
      type: 'personality_change',
      timestamp: new Date(),
      data: {
        trait,
        oldValue,
        newValue,
        context,
      },
    });
  }

  /**
   * Get personality summary for display
   */
  getPersonalitySummary(): PersonalitySummary {
    const { currentMood, communicationStyle, neurodiversityAwareness, spoonSensitivity } = this.personality;
    
    return {
      currentMood: currentMood.type,
      moodIntensity: currentMood.intensity,
      communicationStyle,
      neurodiversityAwareness,
      spoonSensitivity,
      lastUpdated: currentMood.timestamp,
      interactionCount: this.interactionHistory.length,
    };
  }
}

// Type definitions for internal use
interface PersonalityFeedback {
  trait: keyof PersonalityMatrix;
  value: number; // -100 to 100
  intensity: number; // 0-100
  context: string;
}

interface InteractionRecord {
  type: 'personality_change' | 'mood_change' | 'response_generated';
  timestamp: Date;
  data: any;
}

interface ResponseStyle {
  tone: Tone;
  complexity: Complexity;
  length: Length;
  empathyLevel: number;
  technicalLevel: number;
}

type Tone = 'calm' | 'enthusiastic' | 'gentle' | 'professional' | 'warm' | 'precise' | 'expressive' | 'concise' | 'neutral';
type Complexity = 'simple' | 'balanced' | 'detailed' | 'direct';
type Length = 'short' | 'medium' | 'long';

interface ResponseContext {
  conversationHistory: string[];
  userPreferences: UserPreferences;
  currentTask: string;
}

interface UserPreferences {
  communicationStyle: CommunicationStyle;
  technicalLevel: number;
  responseLength: Length;
  empathyNeeds: boolean;
}

interface PersonalitySummary {
  currentMood: string;
  moodIntensity: number;
  communicationStyle: CommunicationStyle;
  neurodiversityAwareness: number;
  spoonSensitivity: number;
  lastUpdated: Date;
  interactionCount: number;
}