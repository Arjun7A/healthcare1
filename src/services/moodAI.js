/**
 * AI-Powered Mood Analysis Service
 * Provides intelligent insights, predictions, and recommendations
 */

export class MoodAI {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the AI model (placeholder for future ML integration)
   */
  async initialize() {
    try {
      // Placeholder for future AI model initialization
      // Could integrate with TensorFlow.js, OpenAI API, or other ML services
      console.log('🧠 MoodAI: Initializing...');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('MoodAI initialization failed:', error);
      return false;
    }
  }

  /**
   * Analyze mood patterns and provide insights
   */
  analyzeMoodPatterns(entries) {
    if (!entries || entries.length === 0) {
      return {
        patterns: [],
        insights: [],
        recommendations: []
      };
    }

    const patterns = this.detectPatterns(entries);
    const insights = this.generateInsights(entries, patterns);
    const recommendations = this.generateRecommendations(entries, patterns);

    return {
      patterns,
      insights,
      recommendations,
      confidence: this.calculateConfidence(entries)
    };
  }

  /**
   * Detect patterns in mood data
   */
  detectPatterns(entries) {
    const patterns = [];
    
    // Weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(entries);
    if (weeklyPattern.strength > 0.6) {
      patterns.push({
        type: 'weekly',
        description: weeklyPattern.description,
        strength: weeklyPattern.strength,
        data: weeklyPattern.data
      });
    }

    // Time-based patterns
    const timePattern = this.analyzeTimePattern(entries);
    if (timePattern.strength > 0.6) {
      patterns.push({
        type: 'temporal',
        description: timePattern.description,
        strength: timePattern.strength,
        data: timePattern.data
      });
    }

    // Activity correlation patterns
    const activityPattern = this.analyzeActivityCorrelation(entries);
    if (activityPattern.strength > 0.6) {
      patterns.push({
        type: 'activity',
        description: activityPattern.description,
        strength: activityPattern.strength,
        data: activityPattern.data
      });
    }

    return patterns;
  }

  /**
   * Analyze weekly mood patterns
   */
  analyzeWeeklyPattern(entries) {
    const dayAverages = {};
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => dayAverages[day] = []);

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const dayName = days[date.getDay()];
      dayAverages[dayName].push(entry.mood);
    });

    // Calculate averages
    const averages = {};
    let totalVariance = 0;
    days.forEach(day => {
      if (dayAverages[day].length > 0) {
        averages[day] = dayAverages[day].reduce((a, b) => a + b, 0) / dayAverages[day].length;
      } else {
        averages[day] = 0;
      }
    });

    // Calculate variance to determine pattern strength
    const values = Object.values(averages).filter(v => v > 0);
    if (values.length < 3) return { strength: 0, description: '', data: {} };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const strength = Math.min(variance / 2, 1); // Normalize to 0-1

    // Find best and worst days
    const sortedDays = Object.entries(averages)
      .filter(([_, avg]) => avg > 0)
      .sort(([_, a], [__, b]) => b - a);

    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    return {
      strength,
      description: `Your mood tends to be highest on ${bestDay[0]}s and lowest on ${worstDay[0]}s`,
      data: averages
    };
  }

  /**
   * Analyze time-based patterns
   */
  analyzeTimePattern(entries) {
    // This would analyze patterns based on time of day, seasons, etc.
    // For now, return a simple analysis
    const recentEntries = entries.slice(-14); // Last 2 weeks
    const oldEntries = entries.slice(-28, -14); // Previous 2 weeks

    if (recentEntries.length < 5 || oldEntries.length < 5) {
      return { strength: 0, description: '', data: {} };
    }

    const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;
    const oldAvg = oldEntries.reduce((sum, entry) => sum + entry.mood, 0) / oldEntries.length;
    
    const trend = recentAvg - oldAvg;
    const strength = Math.min(Math.abs(trend) / 2, 1);

    let description = '';
    if (trend > 0.5) {
      description = 'Your mood has been improving over the past two weeks';
    } else if (trend < -0.5) {
      description = 'Your mood has been declining over the past two weeks';
    } else {
      description = 'Your mood has been relatively stable recently';
    }

    return {
      strength,
      description,
      data: { trend, recentAvg, oldAvg }
    };
  }

  /**
   * Analyze activity correlation with mood
   */
  analyzeActivityCorrelation(entries) {
    const activityMoodMap = {};
    
    entries.forEach(entry => {
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          if (!activityMoodMap[activity]) {
            activityMoodMap[activity] = [];
          }
          activityMoodMap[activity].push(entry.mood);
        });
      }
    });

    // Find activities with strongest correlation
    const correlations = [];
    Object.entries(activityMoodMap).forEach(([activity, moods]) => {
      if (moods.length >= 3) { // Need at least 3 data points
        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        const overallAvg = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
        const correlation = avgMood - overallAvg;
        
        correlations.push({
          activity,
          correlation,
          avgMood,
          count: moods.length
        });
      }
    });

    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    if (correlations.length === 0) {
      return { strength: 0, description: '', data: {} };
    }

    const strongest = correlations[0];
    const strength = Math.min(Math.abs(strongest.correlation) / 2, 1);
    
    const description = strongest.correlation > 0 
      ? `${strongest.activity} tends to boost your mood`
      : `${strongest.activity} tends to lower your mood`;

    return {
      strength,
      description,
      data: { correlations: correlations.slice(0, 5) }
    };
  }

  /**
   * Generate insights based on patterns
   */
  generateInsights(entries, patterns) {
    const insights = [];

    // Recent mood trend
    if (entries.length >= 7) {
      const recent = entries.slice(-7);
      const older = entries.slice(-14, -7);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.mood, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.5) {
          insights.push({
            type: 'positive_trend',
            title: 'Mood is Improving',
            description: 'Your mood has been on an upward trend this week compared to last week.',
            confidence: 0.8
          });
        } else if (recentAvg < olderAvg - 0.5) {
          insights.push({
            type: 'negative_trend',
            title: 'Mood Declining',
            description: 'Your mood has been lower this week compared to last week. Consider reaching out for support.',
            confidence: 0.8
          });
        }
      }
    }

    // Consistency insights
    const moodVariance = this.calculateMoodVariance(entries);
    if (moodVariance < 0.5) {
      insights.push({
        type: 'stability',
        title: 'Stable Mood',
        description: 'Your mood has been relatively stable, which is a positive sign.',
        confidence: 0.7
      });
    } else if (moodVariance > 1.5) {
      insights.push({
        type: 'volatility',
        title: 'Mood Variability',
        description: 'Your mood has been quite variable. Consider tracking potential triggers.',
        confidence: 0.7
      });
    }

    return insights;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(entries, patterns) {
    const recommendations = [];

    // Based on low mood patterns
    const recentLowMoods = entries.slice(-7).filter(e => e.mood <= 2);
    if (recentLowMoods.length >= 3) {
      recommendations.push({
        type: 'self_care',
        priority: 'high',
        title: 'Focus on Self-Care',
        description: 'You\'ve had several low mood days recently. Try incorporating more self-care activities.',
        actions: ['Take a short walk', 'Practice deep breathing', 'Connect with a friend', 'Engage in a hobby you enjoy']
      });
    }

    // Based on activity patterns
    patterns.forEach(pattern => {
      if (pattern.type === 'activity' && pattern.data.correlations) {
        const positiveActivity = pattern.data.correlations.find(c => c.correlation > 0.5);
        if (positiveActivity) {
          recommendations.push({
            type: 'activity',
            priority: 'medium',
            title: 'Boost Your Mood',
            description: `${positiveActivity.activity} seems to improve your mood. Consider doing it more often.`,
            actions: [`Schedule more time for ${positiveActivity.activity}`]
          });
        }
      }
    });

    // General wellness recommendations
    if (entries.length >= 7) {
      const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
      if (avgMood >= 4) {
        recommendations.push({
          type: 'maintenance',
          priority: 'low',
          title: 'Keep Up the Good Work',
          description: 'Your overall mood is good. Continue with your current habits and self-care routine.',
          actions: ['Maintain your current routine', 'Stay connected with supportive people']
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate confidence level for predictions
   */
  calculateConfidence(entries) {
    if (entries.length < 5) return 0.3;
    if (entries.length < 15) return 0.6;
    if (entries.length < 30) return 0.8;
    return 0.9;
  }

  /**
   * Calculate mood variance
   */
  calculateMoodVariance(entries) {
    if (entries.length < 2) return 0;
    
    const mean = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
    const variance = entries.reduce((sum, entry) => sum + Math.pow(entry.mood - mean, 2), 0) / entries.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Predict mood for future days (simple linear regression)
   */
  predictMood(entries, daysAhead = 7) {
    if (entries.length < 5) {
      return {
        predictions: [],
        confidence: 0,
        message: 'Need more data for predictions'
      };
    }

    // Simple trend-based prediction
    const recentEntries = entries.slice(-14);
    const x = recentEntries.map((_, i) => i);
    const y = recentEntries.map(entry => entry.mood);
    
    // Calculate linear regression
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const predictedMood = slope * (n + i - 1) + intercept;
      const clampedMood = Math.max(1, Math.min(5, predictedMood));
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predictedMood: Math.round(clampedMood * 10) / 10,
        confidence: Math.max(0.3, 0.9 - (i * 0.1))
      });
    }

    return {
      predictions,
      confidence: this.calculateConfidence(entries),
      trend: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable'
    };
  }
}

// Export singleton instance
export const moodAI = new MoodAI();

// Auto-initialize
moodAI.initialize();
