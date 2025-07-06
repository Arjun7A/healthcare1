/**
 * Mood Journal API Service
 * Handles data persistence with Supabase only - cloud-first architecture
 */

import { supabase } from '../lib/supabaseClient';

export class MoodJournalAPI {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service and ensure user is authenticated
   */
  async initialize() {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        throw new Error('User not authenticated. Please sign in to use mood journal features.');
      }
      
      console.log('🗄️ MoodJournalAPI: Initialized with Supabase for user:', user.email);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ MoodJournalAPI: Failed to initialize:', error.message);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Ensure the service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Save a mood entry to Supabase
   */
  async saveMoodEntry(entry) {
    await this.ensureInitialized();
    
    const entryWithId = {
      ...entry,
      id: entry.id || this.generateId(),
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.saveToSupabase(entryWithId);
  }

  /**
   * Get all mood entries from Supabase
   */
  async getMoodEntries(options = {}) {
    await this.ensureInitialized();
    const { limit, offset, startDate, endDate, orderBy = 'date' } = options;
    return await this.getFromSupabase({ limit, offset, startDate, endDate, orderBy });
  }

  /**
   * Update a mood entry in Supabase
   */
  async updateMoodEntry(id, updates) {
    await this.ensureInitialized();
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return await this.updateInSupabase(id, updateData);
  }

  /**
   * Delete a mood entry from Supabase
   */
  async deleteMoodEntry(id) {
    await this.ensureInitialized();
    return await this.deleteFromSupabase(id);
  }

  /**
   * Get mood statistics
   */
  async getMoodStats(options = {}) {
    const { days = 30 } = options;
    const entries = await this.getMoodEntries({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    if (!entries.success || entries.data.length === 0) {
      return {
        success: true,
        data: {
          average: 0,
          total: 0,
          trend: 'neutral',
          emotions: [],
          activities: []
        }
      };
    }

    const data = entries.data;
    const average = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
    
    // Calculate trend (last 7 days vs previous 7 days)
    const sortedEntries = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last7Days = sortedEntries.slice(0, 7);
    const previous7Days = sortedEntries.slice(7, 14);
    
    const recent7Average = last7Days.length > 0 ? 
      last7Days.reduce((sum, entry) => sum + entry.mood, 0) / last7Days.length : 0;
    const previous7Average = previous7Days.length > 0 ? 
      previous7Days.reduce((sum, entry) => sum + entry.mood, 0) / previous7Days.length : recent7Average;
    
    let trend = 'neutral';
    if (recent7Average > previous7Average + 0.2) trend = 'improving';
    else if (recent7Average < previous7Average - 0.2) trend = 'declining';

    // Count emotions and activities
    const emotionCounts = {};
    const activityCounts = {};
    
    data.forEach(entry => {
      entry.emotions?.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      entry.activities?.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });

    const emotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
      
    const activities = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));

    return {
      success: true,
      data: {
        average: Math.round(average * 10) / 10,
        total: data.length,
        trend,
        emotions,
        activities
      }
    };
  }

  // ======================
  // SUPABASE METHODS
  // ======================

  async saveToSupabase(entry) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mood_entries')
        .insert([{
          ...entry,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase save failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getFromSupabase(options) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      // Apply ordering
      if (options.orderBy === 'date') {
        query = query.order('created_at', { ascending: false });
      } else if (options.orderBy === 'mood') {
        query = query.order('mood', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform Supabase data to match frontend format
      const transformedData = (data || []).map(entry => ({
        id: entry.id,
        mood: entry.mood,
        emotions: entry.emotions || [],
        activities: entry.activities || [],
        notes: entry.notes || '',
        date: entry.date ? new Date(entry.date).toDateString() : new Date(entry.created_at).toDateString(),
        timestamp: entry.created_at,
        sleep_hours: entry.sleep_hours,
        energy_level: entry.energy_level,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      }));

      return transformedData;
    } catch (error) {
      console.error('❌ Supabase fetch failed:', error);
      return [];
    }
  }

  async updateInSupabase(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mood_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase update failed:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFromSupabase(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Supabase delete failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ======================
  // UTILITY METHODS
  // ======================

  generateId() {
    return 'mood_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatDateForStorage(date) {
    return new Date(date).toISOString();
  }

  getCurrentUser() {
    return supabase.auth.getUser();
  }
}

// Export singleton instance
export const moodJournalAPI = new MoodJournalAPI();
