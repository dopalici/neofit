import React, { useEffect, useState } from 'react';
import { useAppleHealth } from '../hooks/useAppleHealth';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function Sleep() {
  const { healthData, isLoading, error, sleepAnalysis } = useAppleHealth(['sleep'], 'week');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { theme } = useTheme();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSleepStagesData = () => {
    if (!healthData.sleep) return null;

    const labels = healthData.sleep.map(record => formatDate(record.date));
    const deepSleep = healthData.sleep.map(record => record.stages?.deep || 0);
    const remSleep = healthData.sleep.map(record => record.stages?.rem || 0);
    const coreSleep = healthData.sleep.map(record => record.stages?.core || 0);
    const awake = healthData.sleep.map(record => record.stages?.awake || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Deep Sleep',
          data: deepSleep,
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary + '40',
          fill: true,
        },
        {
          label: 'REM Sleep',
          data: remSleep,
          borderColor: theme.colors.secondary,
          backgroundColor: theme.colors.secondary + '40',
          fill: true,
        },
        {
          label: 'Core Sleep',
          data: coreSleep,
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.accent + '40',
          fill: true,
        },
        {
          label: 'Awake',
          data: awake,
          borderColor: theme.colors.error,
          backgroundColor: theme.colors.error + '40',
          fill: true,
        },
      ],
    };
  };

  const getSleepEfficiencyData = () => {
    if (!healthData.sleep) return null;

    const labels = healthData.sleep.map(record => formatDate(record.date));
    const efficiency = healthData.sleep.map(record => record.sleepEfficiency);

    return {
      labels,
      datasets: [
        {
          label: 'Sleep Efficiency',
          data: efficiency,
          borderColor: theme.colors.success,
          backgroundColor: theme.colors.success + '40',
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.colors.text,
        },
      },
      title: {
        display: true,
        text: 'Sleep Analysis',
        color: theme.colors.text,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: theme.colors.border,
        },
        ticks: {
          color: theme.colors.text,
        },
      },
      x: {
        grid: {
          color: theme.colors.border,
        },
        ticks: {
          color: theme.colors.text,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-text">Loading sleep data...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <p className="text-error">Error loading sleep data: {error.message}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-text">Sleep Stages</h2>
          {getSleepStagesData() && (
            <Line data={getSleepStagesData()} options={chartOptions} />
          )}
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-text">Sleep Efficiency</h2>
          {getSleepEfficiencyData() && (
            <Line data={getSleepEfficiencyData()} options={chartOptions} />
          )}
        </div>
      </div>

      {sleepAnalysis && (
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-text">Sleep Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-text">Averages</h3>
              <ul className="space-y-2">
                <li className="text-text">
                  Sleep Duration: {sleepAnalysis.averageSleepDuration.toFixed(1)} hours
                </li>
                <li className="text-text">
                  Sleep Efficiency: {sleepAnalysis.averageSleepEfficiency.toFixed(1)}%
                </li>
                <li className="text-text">
                  Deep Sleep: {sleepAnalysis.averageDeepSleep.toFixed(1)} hours
                </li>
                <li className="text-text">
                  REM Sleep: {sleepAnalysis.averageRemSleep.toFixed(1)} hours
                </li>
                <li className="text-text">
                  Core Sleep: {sleepAnalysis.averageCoreSleep.toFixed(1)} hours
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-text">Recommendations</h3>
              <ul className="space-y-2">
                {sleepAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-text">
                    • {rec}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2 text-text">Consistency Score</h4>
                <div className="w-full bg-background rounded-full h-4">
                  <div
                    className="bg-primary h-4 rounded-full"
                    style={{ width: `${sleepAnalysis.consistencyScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-text mt-1">
                  {sleepAnalysis.consistencyScore.toFixed(0)}/100
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 