import React, { useState } from 'react';
import { Dumbbell, Brain, ChevronDown, ChevronUp, Save } from 'lucide-react';

export default function InvestmentFeature() {
  const [workoutNotes, setWorkoutNotes] = useState(() => {
    const saved = localStorage.getItem('workoutNotes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [bodyMetrics, setBodyMetrics] = useState(() => {
    const saved = localStorage.getItem('bodyMetrics');
    return saved ? JSON.parse(saved) : {
      weight: [],
      bodyFat: [],
      musclePercentage: []
    };
  });
  
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [newMetric, setNewMetric] = useState({
    weight: '',
    bodyFat: '',
    musclePercentage: ''
  });
  
  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('workoutNotes', JSON.stringify(workoutNotes));
  }, [workoutNotes]);
  
  React.useEffect(() => {
    localStorage.setItem('bodyMetrics', JSON.stringify(bodyMetrics));
  }, [bodyMetrics]);
  
  // Add a new workout note
  const addWorkoutNote = () => {
    if (newNote.trim() === '') return;
    
    const now = new Date();
    setWorkoutNotes([
      {
        id: Date.now(),
        date: now.toISOString(),
        content: newNote,
        type: 'workout'
      },
      ...workoutNotes
    ]);
    
    setNewNote('');
  };
  
  // Add new body metrics
  const addBodyMetrics = () => {
    const now = new Date();
    const date = now.toISOString();
    
    // Only update metrics that have been entered
    const updatedMetrics = { ...bodyMetrics };
    
    if (newMetric.weight !== '') {
      updatedMetrics.weight.push({
        date,
        value: parseFloat(newMetric.weight)
      });
    }
    
    if (newMetric.bodyFat !== '') {
      updatedMetrics.bodyFat.push({
        date,
        value: parseFloat(newMetric.bodyFat)
      });
    }
    
    if (newMetric.musclePercentage !== '') {
      updatedMetrics.musclePercentage.push({
        date,
        value: parseFloat(newMetric.musclePercentage)
      });
    }
    
    setBodyMetrics(updatedMetrics);
    setNewMetric({
      weight: '',
      bodyFat: '',
      musclePercentage: ''
    });
  };
  
  // Delete a workout note
  const deleteNote = (id) => {
    setWorkoutNotes(workoutNotes.filter(note => note.id !== id));
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                  disabled={newNote.trim() === ''}
                  className={`flex items-center px-3 py-1 rounded text-xs font-mono ${
                    newNote.trim() === '' 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-cyan-900 text-cyan-300 border border-cyan-600 hover:bg-cyan-800'
                  }`}
                >
                  <Save size={12} className="mr-1" />
                  SAVE LOG
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {workoutNotes.length > 0 ? (
                workoutNotes.map(note => (
                  <div key={note.id} className="bg-gray-900 border border-cyan-900 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center text-xs text-cyan-600 font-mono mb-2">
                        <Dumbbell size={12} className="mr-1" />
                        {formatDate(note.date)}
                      </div>
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="text-cyan-600 hover:text-cyan-400 text-xs"
                      >
                        &times;
                      </button>
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
                disabled={newMetric.weight === '' && newMetric.bodyFat === '' && newMetric.musclePercentage === ''}
                className={`flex items-center px-3 py-1 rounded text-xs font-mono ${
                  newMetric.weight === '' && newMetric.bodyFat === '' && newMetric.musclePercentage === ''
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                    : 'bg-cyan-900 text-cyan-300 border border-cyan-600 hover:bg-cyan-800'
                }`}
              >
                <Save size={12} className="mr-1" />
                RECORD METRICS
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Weight Trend */}
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-cyan-300 font-mono">WEIGHT TREND</div>
                  {bodyMetrics.weight.length > 0 && (
                    <div className="text-xs text-cyan-600 font-mono">
                      LATEST: {bodyMetrics.weight[bodyMetrics.weight.length - 1].value} KG
                    </div>
                  )}
                </div>
                
                {bodyMetrics.weight.length > 1 ? (
                  <div className="relative h-12">
                    {/* Simple line chart - in a real app use recharts or another library */}
                    <div className="absolute inset-0 flex items-end">
                      {bodyMetrics.weight.slice(-10).map((entry, index) => {
                        const min = Math.min(...bodyMetrics.weight.slice(-10).map(e => e.value));
                        const max = Math.max(...bodyMetrics.weight.slice(-10).map(e => e.value));
                        const range = max - min || 1;
                        const height = ((entry.value - min) / range) * 100;
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 bg-cyan-900 mx-0.5 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-cyan-600 font-mono">
                      {bodyMetrics.weight.length === 0 
                        ? 'NO DATA YET' 
                        : 'NEED MORE DATA POINTS FOR TREND'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Body Fat Trend */}
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-cyan-300 font-mono">BODY FAT TREND</div>
                  {bodyMetrics.bodyFat.length > 0 && (
                    <div className="text-xs text-cyan-600 font-mono">
                      LATEST: {bodyMetrics.bodyFat[bodyMetrics.bodyFat.length - 1].value}%
                    </div>
                  )}
                </div>
                
                {bodyMetrics.bodyFat.length > 1 ? (
                  <div className="relative h-12">
                    {/* Simple line chart */}
                    <div className="absolute inset-0 flex items-end">
                      {bodyMetrics.bodyFat.slice(-10).map((entry, index) => {
                        const min = Math.min(...bodyMetrics.bodyFat.slice(-10).map(e => e.value));
                        const max = Math.max(...bodyMetrics.bodyFat.slice(-10).map(e => e.value));
                        const range = max - min || 1;
                        const height = ((entry.value - min) / range) * 100;
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 bg-cyan-900 mx-0.5 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-cyan-600 font-mono">
                      {bodyMetrics.bodyFat.length === 0 
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