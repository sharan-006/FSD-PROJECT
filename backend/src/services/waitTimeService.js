/**
 * QVeue Waiting-Time Calculation Engine
 * 
 * Implements realistic waiting-time estimation with:
 * 1. Base formula: Customers Ahead × Average Service Time
 * 2. Multi-counter throughput distribution
 * 3. Dynamic rolling service duration adjustments from recently completed entries
 * 4. Extensible AI/ML predictive model interface hook
 */

class AIWaitTimePredictorInterface {
  /**
   * Stub for external AI / ML Model integration
   * e.g., Random Forest, XGBoost, or Neural Network trained on
   * time-of-day, day-of-week, staff speed factor, and queue surge.
   */
  async predict(features) {
    // When external AI model endpoint or ONNX runtime is plugged in:
    // return externalAIModel.predict(features);
    return null; // Fallback to dynamic statistical engine
  }
}

const aiPredictor = new AIWaitTimePredictorInterface();

/**
 * Calculates estimated wait time dynamically.
 * 
 * @param {Object} options
 * @param {number} options.customersAhead - Number of people ahead in queue
 * @param {number} options.averageServiceTime - Configured average service time (minutes)
 * @param {number} [options.activeCounters=1] - Number of open counters serving this service
 * @param {Array} [options.recentCompletedEntries=[]] - Recent queue completions for moving average
 * @param {Object} [options.context={}] - Context metadata (e.g. timeOfDay, dayOfWeek) for future AI
 * @returns {Promise<Object>} Detailed estimation result
 */
async function calculateWaitTime({
  customersAhead = 0,
  averageServiceTime = 5,
  activeCounters = 1,
  recentCompletedEntries = [],
  context = {}
}) {
  if (customersAhead <= 0) {
    return {
      estimatedMinutes: 0,
      formattedWait: '0 min',
      customersAhead: 0,
      averageServiceTime,
      activeCounters: Math.max(1, activeCounters),
      confidence: 1.0,
      algorithm: 'instant_turn'
    };
  }

  // 1. Check for AI Model prediction hook first
  try {
    const aiPrediction = await aiPredictor.predict({
      customersAhead,
      averageServiceTime,
      activeCounters,
      context
    });
    if (aiPrediction && typeof aiPrediction.estimatedMinutes === 'number') {
      return {
        ...aiPrediction,
        algorithm: 'ai_predictive_model_v1'
      };
    }
  } catch (err) {
    console.warn('[WaitTimeService] AI Predictor fallback triggered:', err.message);
  }

  // 2. Calculate dynamic moving average if recent completions exist
  let effectiveServiceTime = averageServiceTime;
  if (recentCompletedEntries && recentCompletedEntries.length > 0) {
    const validDurations = recentCompletedEntries
      .map(entry => {
        if (entry.calledAt && entry.completedAt) {
          const durationMin = (new Date(entry.completedAt) - new Date(entry.calledAt)) / (1000 * 60);
          return durationMin > 0.5 && durationMin < 120 ? durationMin : null;
        }
        return null;
      })
      .filter(Boolean);

    if (validDurations.length >= 3) {
      const sum = validDurations.reduce((a, b) => a + b, 0);
      const rollingAvg = sum / validDurations.length;
      // Blend 60% configured base + 40% real-time rolling average
      effectiveServiceTime = Math.round((averageServiceTime * 0.6 + rollingAvg * 0.4) * 10) / 10;
    }
  }

  // 3. Multi-counter throughput distribution
  const openCounters = Math.max(1, activeCounters);
  const totalMinutes = Math.max(1, Math.round((customersAhead * effectiveServiceTime) / openCounters));

  return {
    estimatedMinutes: totalMinutes,
    formattedWait: totalMinutes === 1 ? '1 min' : `${totalMinutes} min`,
    customersAhead,
    averageServiceTime: effectiveServiceTime,
    configuredServiceTime: averageServiceTime,
    activeCounters: openCounters,
    confidence: effectiveServiceTime === averageServiceTime ? 0.88 : 0.94,
    algorithm: 'dynamic_rolling_distribution_v1',
    aiIntegrationReady: true
  };
}

module.exports = {
  calculateWaitTime,
  AIWaitTimePredictorInterface
};
