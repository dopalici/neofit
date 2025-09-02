import React, { useState, useEffect } from 'react';
import appleHealthService from '../services/appleHealthService';

const HealthDataTest = () => {
  const [healthData, setHealthData] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      // Set user profile (you can adjust these values)
      appleHealthService.setUserProfile({
        age: 30,
        gender: 'male',
        weight: 75,
        activityLevel: 'moderately_active'
      });

      // Initialize and request permissions
      const available = await appleHealthService.initialize();
      
      if (available) {
        const hasPermissions = await appleHealthService.requestPermissions();
        
        if (hasPermissions) {
          // Get comprehensive health data
          const data = await appleHealthService.getComprehensiveHealthData();
          setHealthData(data);
          
          // Calculate fitness assessment
          const assessment = await appleHealthService.calculateFitnessAssessment();
          setFitnessScore(assessment);
        } else {
          setError('HealthKit permissions not granted');
        }
      } else {
        setError('HealthKit not available on this device');
      }
    } catch (err) {
      console.error('Error loading health data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Health Data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#f0f0f0' }}>
      <h1>🏥 Your Apple Health Data</h1>
      
      {fitnessScore && (
        <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>💪 Fitness Assessment</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: fitnessScore.overallScore >= 70 ? '#4CAF50' : fitnessScore.overallScore >= 50 ? '#FFA500' : '#F44336' }}>
            {fitnessScore.overallScore}/100
          </div>
          <p>Category: <strong>{fitnessScore.category}</strong></p>
          
          <h3>Component Scores:</h3>
          <ul>
            <li>Cardiovascular: {fitnessScore.components.cardiovascular?.score || 0}/100</li>
            <li>Activity: {fitnessScore.components.activity?.score || 0}/100</li>
            <li>Body Composition: {fitnessScore.components.bodyComposition?.score || 0}/100</li>
            <li>Recovery: {fitnessScore.components.recovery?.score || 0}/100</li>
            <li>Nutrition: {fitnessScore.components.nutrition?.score || 0}/100</li>
          </ul>
          
          {fitnessScore.strengths?.length > 0 && (
            <>
              <h3>✅ Strengths:</h3>
              <ul>
                {fitnessScore.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
          
          {fitnessScore.weaknesses?.length > 0 && (
            <>
              <h3>⚠️ Areas to Improve:</h3>
              <ul>
                {fitnessScore.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      {healthData && (
        <>
          <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>❤️ Cardiovascular</h2>
            {healthData.cardiovascular?.vo2Max?.value && (
              <p>VO2 Max: <strong>{healthData.cardiovascular.vo2Max.value.toFixed(1)}</strong> ml/kg/min ({healthData.cardiovascular.vo2Max.category})</p>
            )}
            {healthData.cardiovascular?.heartRate?.resting && (
              <p>Resting Heart Rate: <strong>{healthData.cardiovascular.heartRate.resting}</strong> bpm</p>
            )}
            {healthData.cardiovascular?.heartRateVariability?.value && (
              <p>HRV: <strong>{healthData.cardiovascular.heartRateVariability.value.toFixed(1)}</strong> ms ({healthData.cardiovascular.heartRateVariability.trend})</p>
            )}
            {healthData.cardiovascular?.bloodOxygen?.value && (
              <p>Blood Oxygen: <strong>{healthData.cardiovascular.bloodOxygen.value.toFixed(1)}</strong>% ({healthData.cardiovascular.bloodOxygen.status})</p>
            )}
          </div>

          <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>🏃 Activity</h2>
            {healthData.activity?.steps?.daily && (
              <p>Today's Steps: <strong>{healthData.activity.steps.daily.toLocaleString()}</strong> / {healthData.activity.steps.goal.toLocaleString()}</p>
            )}
            {healthData.activity?.exerciseTime?.daily && (
              <p>Exercise Time: <strong>{healthData.activity.exerciseTime.daily}</strong> / {healthData.activity.exerciseTime.goal} minutes</p>
            )}
            {healthData.activity?.calories?.active && (
              <p>Active Calories: <strong>{healthData.activity.calories.active.toFixed(0)}</strong> kcal</p>
            )}
            {healthData.activity?.distance?.daily && (
              <p>Distance: <strong>{healthData.activity.distance.daily.toFixed(2)}</strong> km</p>
            )}
          </div>

          <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>💪 Body Composition</h2>
            {healthData.bodyComposition?.weight?.current && (
              <p>Weight: <strong>{healthData.bodyComposition.weight.current.toFixed(1)}</strong> kg ({healthData.bodyComposition.weight.trend})</p>
            )}
            {healthData.bodyComposition?.bmi?.value && (
              <p>BMI: <strong>{healthData.bodyComposition.bmi.value.toFixed(1)}</strong> ({healthData.bodyComposition.bmi.category})</p>
            )}
            {healthData.bodyComposition?.bodyFat?.percentage && (
              <p>Body Fat: <strong>{healthData.bodyComposition.bodyFat.percentage.toFixed(1)}</strong>% ({healthData.bodyComposition.bodyFat.category})</p>
            )}
          </div>

          <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>😴 Sleep</h2>
            {healthData.sleep?.weeklyAverage ? (
              <>
                <p>Weekly Average: <strong>{healthData.sleep.weeklyAverage.toFixed(1)}</strong> hours</p>
                <p>Sleep Quality: <strong>{healthData.sleep.quality}</strong></p>
                <p>Trend: <strong>{healthData.sleep.trend}</strong></p>
              </>
            ) : (
              <p>No sleep data available</p>
            )}
          </div>

          <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>🏋️ Workouts</h2>
            <p>This Week: <strong>{healthData.workouts?.weeklyCount || 0}</strong> workouts</p>
            <p>This Month: <strong>{healthData.workouts?.monthlyCount || 0}</strong> workouts</p>
            {healthData.workouts?.favoriteTypes?.length > 0 && (
              <p>Favorite Types: <strong>{healthData.workouts.favoriteTypes.join(', ')}</strong></p>
            )}
          </div>

          {fitnessScore?.recommendations?.length > 0 && (
            <div style={{ background: '#fff', padding: '15px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2>📋 Recommendations</h2>
              {fitnessScore.recommendations.map((rec, i) => (
                <div key={i} style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <h3>{rec.title}</h3>
                  <p>{rec.description}</p>
                  <p><strong>Expected Impact:</strong> {rec.expectedImpact}</p>
                  <p><strong>Timeframe:</strong> {rec.timeframe}</p>
                  <ul>
                    {rec.actions.map((action, j) => <li key={j}>{action}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button 
        onClick={loadHealthData}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Refresh Data
      </button>
    </div>
  );
};

export default HealthDataTest;