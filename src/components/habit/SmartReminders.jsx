import React, { useState, useEffect } from 'react';
import { Clock, Settings, Bell, BellOff, Plus, Trash, X } from 'lucide-react';

export default function SmartReminders({ reminders = [], onUpdateReminders }) {
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [localReminders, setLocalReminders] = useState(reminders);
  const [selectedDays, setSelectedDays] = useState([]);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalReminders(reminders);
  }, [reminders]);
  
  // Request notifications permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      setTimeout(() => {
        Notification.requestPermission();
      }, 5000); // Delay asking for permission
    }
  }, []);
  
  // Check for reminders that need to be triggered
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      localReminders.forEach(reminder => {
        // Check if reminder is enabled, scheduled for today, and it's time to trigger
        if (
          reminder.enabled && 
          reminder.days.includes(currentDay) && 
          reminder.time === currentTime && 
          reminder.lastTriggered !== now.toDateString() + currentTime
        ) {
          // Trigger notification
          if (Notification.permission === 'granted') {
            new Notification(`NEO•FIT: ${reminder.title}`, {
              body: 'Time for your scheduled fitness activity.',
              icon: '/logo192.png'
            });
          }
          
          // Update last triggered time
          setLocalReminders(prev => prev.map(r => 
            r.id === reminder.id 
              ? { ...r, lastTriggered: now.toDateString() + currentTime }
              : r
          ));
          
          if (onUpdateReminders) {
            onUpdateReminders(localReminders.map(r => 
              r.id === reminder.id 
                ? { ...r, lastTriggered: now.toDateString() + currentTime }
                : r
            ));
          }
        }
      });
    };
    
    // Check for reminders every minute
    const interval = setInterval(checkReminders, 60000);
    
    return () => clearInterval(interval);
  }, [localReminders, onUpdateReminders]);
  
  // Toggle reminder enabled state
  const toggleReminder = (id) => {
    const updatedReminders = localReminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder
    );
    
    setLocalReminders(updatedReminders);
    
    if (onUpdateReminders) {
      onUpdateReminders(updatedReminders);
    }
  };
  
  // Open modal to edit a reminder
  const editReminder = (reminder) => {
    setEditingReminder(reminder);
    setSelectedDays(reminder.days);
    setShowModal(true);
  };
  
  // Create a new reminder
  const createReminder = () => {
    const defaultTime = new Date();
    defaultTime.setHours(8);
    defaultTime.setMinutes(0);
    
    const newId = Math.max(0, ...localReminders.map(r => r.id), 0) + 1;
    const newReminder = {
      id: newId,
      title: '',
      description: '',
      time: `${String(defaultTime.getHours()).padStart(2, '0')}:${String(defaultTime.getMinutes()).padStart(2, '0')}`,
      days: [1, 2, 3, 4, 5], // Monday to Friday by default
      enabled: true,
      lastTriggered: null
    };
    
    setEditingReminder(newReminder);
    setSelectedDays(newReminder.days);
    setShowModal(true);
  };
  
  // Save the edited reminder
  const saveReminder = () => {
    if (!editingReminder.title.trim()) {
      // Require a title
      return;
    }
    
    let updatedReminders;
    
    if (localReminders.some(r => r.id === editingReminder.id)) {
      // Update existing reminder
      updatedReminders = localReminders.map(r => 
        r.id === editingReminder.id ? { ...editingReminder, days: selectedDays } : r
      );
    } else {
      // Add new reminder
      updatedReminders = [...localReminders, { ...editingReminder, days: selectedDays }];
    }
    
    setLocalReminders(updatedReminders);
    
    if (onUpdateReminders) {
      onUpdateReminders(updatedReminders);
    }
    
    setShowModal(false);
    setEditingReminder(null);
  };
  
  // Delete a reminder
  const deleteReminder = (id) => {
    const updatedReminders = localReminders.filter(r => r.id !== id);
    
    setLocalReminders(updatedReminders);
    
    if (onUpdateReminders) {
      onUpdateReminders(updatedReminders);
    }
    
    setShowModal(false);
    setEditingReminder(null);
  };
  
  // Toggle day selection in the modal
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  // Generate smart suggestions based on habit pattern (like workout days)
  const generateSuggestions = () => {
    // This would connect to actual user data in a real app
    return [
      {
        title: "MORNING ACTIVITY",
        time: "07:30",
        days: [1, 3, 5], // Mon, Wed, Fri
        description: "Start your day with a workout"
      },
      {
        title: "EVENING STRETCH",
        time: "19:00",
        days: [1, 2, 3, 4, 5], // Weekdays
        description: "Flexibility session to wind down"
      },
      {
        title: "WEEKEND CARDIO",
        time: "10:00",
        days: [0, 6], // Sat, Sun
        description: "Long-form cardio session"
      }
    ];
  };
  
  // Apply a suggestion to create a new reminder
  const applySuggestion = (suggestion) => {
    const newId = Math.max(0, ...localReminders.map(r => r.id), 0) + 1;
    
    setEditingReminder({
      id: newId,
      title: suggestion.title,
      description: suggestion.description || '',
      time: suggestion.time,
      days: suggestion.days,
      enabled: true,
      lastTriggered: null
    });
    
    setSelectedDays(suggestion.days);
    setShowModal(true);
  };
  
  // Day name mapping
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">OPTIMIZATION REMINDERS</h3>
          <button 
            onClick={createReminder}
            className="text-cyan-600 text-xs font-mono hover:text-cyan-400 flex items-center"
          >
            <Plus size={14} className="mr-1" />
            NEW REMINDER
          </button>
        </div>
        
        {localReminders.length > 0 ? (
          <div className="space-y-3">
            {localReminders.map(reminder => (
              <div 
                key={reminder.id}
                className="bg-gray-900 p-3 rounded-lg border border-cyan-900 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-mono text-sm text-cyan-300">{reminder.title}</h4>
                  <div className="flex items-center mt-1">
                    <Clock size={12} className="text-cyan-600 mr-1" />
                    <p className="text-xs text-cyan-600 font-mono">
                      {formatTime(reminder.time)} · {
                        reminder.days.map(day => dayNames[day]).join(', ')
                      }
                    </p>
                  </div>
                  {reminder.description && (
                    <p className="text-xs text-cyan-600 font-mono mt-1">{reminder.description}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => editReminder(reminder)}
                    className="text-cyan-600 mr-2 hover:text-cyan-400"
                  >
                    <Settings size={16} />
                  </button>
                  
                  <button 
                    onClick={() => toggleReminder(reminder.id)}
                    className={`${reminder.enabled ? 'text-cyan-400' : 'text-gray-600'} hover:text-cyan-300`}
                  >
                    {reminder.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="text-center py-4 bg-gray-900 rounded-lg border border-gray-800 mb-4">
              <p className="text-cyan-600 text-sm font-mono">NO REMINDERS CONFIGURED</p>
              <button 
                onClick={createReminder}
                className="mt-2 bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
              >
                CREATE FIRST REMINDER
              </button>
            </div>
            
            {/* Suggested reminders */}
            <div className="mt-6">
              <h4 className="text-xs font-mono text-cyan-600 mb-2">RECOMMENDED SCHEDULES</h4>
              <div className="space-y-2">
                {generateSuggestions().map((suggestion, index) => (
                  <div 
                    key={index}
                    className="bg-gray-900/50 p-3 rounded-lg border border-cyan-900/30 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-mono text-sm text-cyan-300/80">{suggestion.title}</h4>
                      <div className="flex items-center mt-1">
                        <Clock size={12} className="text-cyan-600/80 mr-1" />
                        <p className="text-xs text-cyan-600/80 font-mono">
                          {formatTime(suggestion.time)} · {
                            suggestion.days.map(day => dayNames[day]).join(', ')
                          }
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => applySuggestion(suggestion)}
                      className="text-xs text-cyan-300 bg-cyan-900/60 border border-cyan-800/60 rounded px-2 py-1"
                    >
                      USE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit reminder modal */}
      {showModal && editingReminder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-800 rounded-lg p-5 w-80 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-cyan-300 font-mono">
                {editingReminder.id && localReminders.some(r => r.id === editingReminder.id) ? 'EDIT REMINDER' : 'NEW REMINDER'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingReminder(null);
                }}
                className="text-cyan-600 hover:text-cyan-400"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">TITLE</label>
                <input
                  type="text"
                  value={editingReminder.title}
                  onChange={(e) => setEditingReminder({...editingReminder, title: e.target.value})}
                  placeholder="WORKOUT REMINDER"
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-cyan-300 text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">DESCRIPTION (OPTIONAL)</label>
                <input
                  type="text"
                  value={editingReminder.description || ''}
                  onChange={(e) => setEditingReminder({...editingReminder, description: e.target.value})}
                  placeholder="Time to optimize your routine"
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-cyan-300 text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">TIME</label>
                <input
                  type="time"
                  value={editingReminder.time}
                  onChange={(e) => setEditingReminder({...editingReminder, time: e.target.value})}
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-cyan-300 text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">DAYS</label>
                <div className="flex justify-between">
                  {dayNames.map((day, index) => (
                    <button 
                      key={index}
                      onClick={() => toggleDay(index)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                        selectedDays.includes(index) 
                          ? 'bg-cyan-900 border-cyan-600 text-cyan-300' 
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminder-enabled"
                  checked={editingReminder.enabled}
                  onChange={(e) => setEditingReminder({...editingReminder, enabled: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="reminder-enabled" className="text-sm text-cyan-300 font-mono">
                  ENABLE REMINDER
                </label>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              {editingReminder.id && localReminders.some(r => r.id === editingReminder.id) ? (
                <button 
                  onClick={() => deleteReminder(editingReminder.id)}
                  className="flex items-center bg-red-900/30 text-red-400 border border-red-800 px-3 py-1 rounded text-xs hover:bg-red-900/50 transition"
                >
                  <Trash size={12} className="mr-1" />
                  DELETE
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingReminder(null);
                  }}
                  className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-700 transition"
                >
                  CANCEL
                </button>
              )}
              
              <button 
                onClick={saveReminder}
                disabled={!editingReminder.title.trim() || selectedDays.length === 0}
                className={`bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-1 rounded text-xs hover:bg-cyan-800 transition ${
                  !editingReminder.title.trim() || selectedDays.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}