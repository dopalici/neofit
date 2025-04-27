import React, { useState, useEffect } from 'react';
import { Dumbbell, Brain, ChevronDown, ChevronUp, Save, Target } from 'lucide-react';
import { format } from 'date-fns';

export default function InvestmentFeature({ 
  bodyMetrics, 
  workoutNotes,
  onLogMetrics,
  onLogWorkoutNotes 
}) {
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [newMetric, setNewMetric] = useState({
    weight: '',
    bodyFat: '',
    musclePercentage: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [investmentTips, setInvestmentTips] = useState([]);
  
  // Generate investment tips that vary based on usage patterns
  useEffect(() => {
    const tips = [
      {
        id: 1,
        title: 'CONSISTENCY MULTIPLIER',
        description: 'Recording metrics weekly improves long-term outcomes by 37%',
        icon: <Target size={16} className="text-cyan-500" />
      },
      {
        id: 2,
        title: 'INSIGHT ACTIVATION',
        description: 'Log workout observations to identify optimal performance patterns',
        icon: <Brain size={16} className="text-cyan-500" />
      },
      {
        id: 3,
        title: 'NEURAL REINFORCEMENT',
        description: 'Each entry strengthens habit neural pathways in your brain',
        icon: <Dumbbell size={16} className="text-cyan-500" />
      }
    ];
    
    // Show different tips based on usage
    if (bodyMetrics && (bodyMetrics.weight.length > 0 || bodyMetrics.bodyFat.length > 0)) {
      tips.push({
        id: 4,
        title: 'TREND OPTIMIZATION',
        description: 'Your consistent logging has enabled enhanced pattern recognition',
        icon: <Target size={16} className="text-cyan-500" />
      });
    }
    
    if (workoutNotes && workoutNotes.length > 2) {
      tips.push({
        id: 5,
        title: 'REFLECTION AMPLIFIER',
        description: 'Your workout notes are building a personalized improvement database',
        icon: <Brain size={16} className="text-cyan-500" />
      });
    }
    
    // Randomly select 2 tips to show
    const randomTips = [];
    while (randomTips.length < 2 && tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * tips.length);
      randomTips.push(tips[randomIndex]);
      tips.splice(randomIndex, 1);
    }
    
    setInvestmentTips(randomTips);
  }, [bodyMetrics, workoutNotes]);
  
  // Add a new workout note
  const addWorkoutNote = async () => {
    if (newNote.trim() === '') return;
    
    setIsSaving(true);
    
    try {
      if (onLogWorkoutNotes) {
        const result = await onLogWorkoutNotes(newNote);
        
        if (result.success) {
          setNewNote('');
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error('Error saving workout note:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add new body metrics
  const addBodyMetrics = async () => {
    // Only save if at least one metric has been entered
    if (newMetric.weight === '' && newMetric.bodyFat === '' && newMetric.musclePercentage === '') {
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (onLogMetrics) {
        const result = await onLogMetrics(newMetric);
        
        if (result.success) {
          setNewMetric({
            weight: '',
            bodyFat: '',
            musclePercentage: ''
          });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error('Error saving body metrics:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, h:mm a');
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">PERSONAL OPTIMIZATION DATA</h3>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('notes')}
              className={`text-xs font-mono px-3 py-1 rounded ${
                activeTab === 'notes' 
                  ? 'bg-cyan-900 text-cyan-300 border border-cyan-600' 
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              WORKOUT LOGS
            </button>
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`text-xs font-mono px-3 py-1 rounded ${
                activeTab === 'metrics' 
                  ? 'bg-cyan-900 text-cyan-300 border border-cyan-600' 
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              BODY METRICS
            </button>
          </div>
        </div>
        
        {/* Investment tips - making users feel their data entry is valuable */}
        <div className="mb-4 bg-gray-900/50 border border-cyan-900/50 rounded-lg p-3">
          <div className="flex items-start space-x-3">
            <div className="bg-cyan-900/30 rounded-full p-2">
              <Brain size={16} className="text-cyan-500" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-cyan-300 font-mono">
                INVESTMENT AMPLIFIES RESULTS
              </h4>
              <div className="mt-2 space-y-2">
                {investmentTips.map(tip => (
                  <div key={tip.id} className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {tip.icon}
                    </div>
                    <div>
                      <p className="text-xs text-cyan-300 font-mono">{tip.title}</p>
                      <p className="text-xs text-cyan-600 font-mono">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {activeTab === 'notes' ? (
          <>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="LOG YOUR WORKOUT OBSERVATIONS..."
                className="w-full bg-gray-900 border border-cyan-900 rounded p-3 text-cyan-300 text-sm font-mono focus:outline-none focus:border-cyan-700"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={addWorkoutNote}
                  disabled={newNote.trim() === '' || isSaving}
                  className={`flex items-center px-3 py-1 rounded text-xs font-mono ${
                    newNote.trim() === '' || isSaving
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-cyan-900 text-cyan-300 border border-cyan-600 hover:bg-cyan-800'
                  }`}
                >
                  <Save size={12} className="mr-1" />
                  {isSaving ? 'SAVING...' : saveSuccess ? 'SAVED!' : 'SAVE LOG'}
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {workoutNotes && workoutNotes.length > 0 ? (
                workoutNotes.map(note => (
                  <div key={note.id} className="bg-gray-900 border border-cyan-900 rounded p-3">
                    <div className="flex items-center text-xs text-cyan-600 font-mono mb-2">
                      <Dumbbell size={12} className="mr-1" />
                      {formatDate(note.date)}
                    </div>
                    <p className="text-sm text-cyan-300 font-mono whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-cyan-600 text-sm font-mono">NO WORKOUT LOGS YET</p>
                  <p className="text-xs text-cyan-600 font-mono mt-1">Log your workouts to track progress</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">WEIGHT (KG)</label>
                <input
                  type="number"
                  value={newMetric.weight}
                  onChange={(e) => setNewMetric({...newMetric, weight: e.target.value})}
                  className="w-full bg-gray-900 border border-cyan-900 rounded p-2 text-cyan-300 text-sm font-mono focus:outline-none focus:border-cyan-700"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">BODY FAT (%)</label>
                <input
                  type="number"
                  value={newMetric.bodyFat}
                  onChange={(e) => setNewMetric({...newMetric, bodyFat: e.target.value})}
                  className="w-full bg-gray-900 border border-cyan-900 rounded p-2 text-cyan-300 text-sm font-mono focus:outline-none focus:border-cyan-700"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">MUSCLE (%)</label>
                <input
                  type="number"
                  value={newMetric.musclePercentage}
                  onChange={(e) => setNewMetric({...newMetric, musclePercentage: e.target.value})}
                  className="w-full bg-gray-900 border border-cyan-900 rounded p-2 text-cyan-300 text-sm font-mono focus:outline-none focus:border-cyan-700"
                />
              </div>
            </div>
            
            <div className="flex justify-end mb-4">
              <button 
                onClick={addBodyMetrics}
                disabled={(newMetric.weight === '' && newMetric.bodyFat === '' && newMetric.musclePercentage === '') || isSaving}
                className={`flex items-center px-3 py-1 rounded text-xs font-mono ${
                  (newMetric.weight === '' && newMetric.bodyFat === '' && newMetric.musclePercentage === '') || isSaving
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                    : 'bg-cyan-900 text-cyan-300 border border-cyan-600 hover:bg-cyan-800'
                }`}
              >
                <Save size={12} className="mr-1" />
                {isSaving ? 'SAVING...' : saveSuccess ? 'SAVED!' : 'RECORD METRICS'}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Weight Trend */}
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-cyan-300 font-mono">WEIGHT TREND</div>
                  {bodyMetrics && bodyMetrics.weight && bodyMetrics.weight.length > 0 && (
                    <div className="text-xs text-cyan-600 font-mono">
                      LATEST: {bodyMetrics.weight[0].value} KG
                    </div>
                  )}
                </div>
                
                {bodyMetrics && bodyMetrics.weight && bodyMetrics.weight.length > 1 ? (
                  <div className="relative h-14">
                    {/* Simple line chart visualization */}
                    <div className="absolute inset-0 flex items-end">
                      {bodyMetrics.weight.slice(0, 10).reverse().map((entry, index) => {
                        const min = Math.min(...bodyMetrics.weight.slice(0, 10).map(e => e.value));
                        const max = Math.max(...bodyMetrics.weight.slice(0, 10).map(e => e.value));
                        const range = max - min || 1;
                        const height = Math.max(10, ((entry.value - min) / range) * 80);
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 mx-0.5 flex flex-col items-center justify-end"
                          >
                            <div 
                              className="w-full bg-cyan-900 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${entry.value}kg on ${format(new Date(entry.date), 'MMM d')}`}
                            ></div>
                            {index % 2 === 0 && index < bodyMetrics.weight.length - 1 && (
                              <div className="text-xs text-cyan-600 font-mono mt-1 truncate w-full text-center">
                                {format(new Date(entry.date), 'M/d')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-cyan-600 font-mono">
                      {!bodyMetrics || !bodyMetrics.weight || bodyMetrics.weight.length === 0
                        ? 'NO DATA YET' 
                        : 'NEED MORE DATA POINTS FOR TREND'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Body Fat Trend */}
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-cyan-300 font-mono">BODY COMPOSITION</div>
                  {bodyMetrics && bodyMetrics.bodyFat && bodyMetrics.bodyFat.length > 0 && (
                    <div className="text-xs text-cyan-600 font-mono">
                      LATEST: {bodyMetrics.bodyFat[0].value}% FAT
                    </div>
                  )}
                </div>
                
                {bodyMetrics && bodyMetrics.bodyFat && bodyMetrics.bodyFat.length > 1 ? (
                  <div className="relative h-14">
                    {/* Simple line chart visualization */}
                    <div className="absolute inset-0 flex items-end">
                      {bodyMetrics.bodyFat.slice(0, 10).reverse().map((entry, index) => {
                        const min = Math.min(...bodyMetrics.bodyFat.slice(0, 10).map(e => e.value));
                        const max = Math.max(...bodyMetrics.bodyFat.slice(0, 10).map(e => e.value));
                        const range = max - min || 1;
                        const height = Math.max(10, ((entry.value - min) / range) * 80);
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 mx-0.5 flex flex-col items-center justify-end"
                          >
                            <div 
                              className="w-full bg-cyan-900 rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${entry.value}% on ${format(new Date(entry.date), 'MMM d')}`}
                            ></div>
                            {index % 2 === 0 && index < bodyMetrics.bodyFat.length - 1 && (
                              <div className="text-xs text-cyan-600 font-mono mt-1 truncate w-full text-center">
                                {format(new Date(entry.date), 'M/d')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-cyan-600 font-mono">
                      {!bodyMetrics || !bodyMetrics.bodyFat || bodyMetrics.bodyFat.length === 0
                        ? 'NO DATA YET' 
                        : 'NEED MORE DATA POINTS FOR TREND'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}