import React, { useState, useEffect } from 'react';
import { Clock, Settings, Bell, BellOff } from 'lucide-react';

export default function SmartReminders() {
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('fitnessReminders');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        title: 'MORNING CARDIO PROTOCOL', 
        time: '07:00', 
        days: [1, 2, 3, 4, 5], // Monday to Friday
        enabled: true,
        lastTriggered: null
      },
      { 
        id: 2, 
        title: 'NUTRITIONAL OPTIMIZATION', 
        time: '12:30', 
        days: [1, 2, 3, 4, 5], 
        enabled: true,
        lastTriggered: null
      },
      { 
        id: 3, 
        title: 'STRENGTH ENHANCEMENT', 
        time: '18:00', 
        days: [1, 3, 5], // Monday, Wednesday, Friday
        enabled: true,
        lastTriggered: null
      }
    ];
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  
  // Check for reminders that need to be triggered
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        // Check if reminder is enabled, scheduled for today, and it's time to trigger
        if (
          reminder.enabled && 
          reminder.days.includes(currentDay) && 
          reminder.time === currentTime && 
          reminder.lastTriggered !== now.toDateString() + currentTime
        ) {
          // Trigger notification
          if (Notification.permission === 'granted') {
            new Notification(`NEO•VITRU: ${reminder.title}`, {
              body: 'Time to optimize your performance.',
              icon: '/logo192.png'
            });
          }
          
          // Update last triggered time
          setReminders(prev => prev.map(r => 
            r.id === reminder.id 
              ? { ...r, lastTriggered: now.toDateString() + currentTime }
              : r
          ));
        }
      });
    };
    
    // Check for reminders every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    return () => clearInterval(interval);
  }, [reminders]);
  
  // Save reminders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('fitnessReminders', JSON.stringify(reminders));
  }, [reminders]);
  
  // Toggle reminder enabled state
  const toggleReminder = (id) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder
    ));
  };
  
  // Open modal to edit a reminder
  const editReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };
  
  // Create a new reminder
  const createReminder = () => {
    const newId = Math.max(0, ...reminders.map(r => r.id)) + 1;
    setEditingReminder({
      id: newId,
      title: '',
      time: '12:00',
      days: [1, 2, 3, 4, 5],
      enabled: true,
      lastTriggered: null
    });
    setShowModal(true);
  };
  
  // Save the edited reminder
  const saveReminder = (updatedReminder) => {
    if (reminders.some(r => r.id === updatedReminder.id)) {
      // Update existing reminder
      setReminders(prev => prev.map(r => 
        r.id === updatedReminder.id ? updatedReminder : r
      ));
    } else {
      // Add new reminder
      setReminders(prev => [...prev, updatedReminder]);
    }
    setShowModal(false);
    setEditingReminder(null);
  };
  
  // Delete a reminder
  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    setShowModal(false);
    setEditingReminder(null);
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">OPTIMIZATION REMINDERS</h3>
          <button 
            onClick={createReminder}
            className="text-cyan-600 text-xs font-mono hover:text-cyan-400"
          >
            NEW REMINDER
          </button>
        </div>
        
        <div className="space-y-3">
          {reminders.map(reminder => (
            <div 
              key={reminder.id}
              className="bg-gray-900 p-3 rounded-lg border border-cyan-900 flex justify-between items-center"
            >
              <div>
                <h4 className="font-mono text-sm text-cyan-300">{reminder.title}</h4>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-cyan-600 mr-1" />
                  <p className="text-xs text-cyan-600 font-mono">
                    {reminder.time} · {
                      reminder.days.map(day => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][day]).join(', ')
                    }
                  </p>
                </div>
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
          
          {reminders.length === 0 && (
            <div className="text-center py-4">
              <p className="text-cyan-600 text-sm font-mono">NO REMINDERS CONFIGURED</p>
              <button 
                onClick={createReminder}
                className="mt-2 bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
              >
                CREATE FIRST REMINDER
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit reminder modal */}
      {showModal && editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-800 rounded-lg p-4 w-80">
            <h3 className="text-cyan-300 font-mono mb-4">
              {editingReminder.id ? 'EDIT REMINDER' : 'NEW REMINDER'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">TITLE</label>
                <input
                  type="text"
                  value={editingReminder.title}
                  onChange={(e) => setEditingReminder({...editingReminder, title: e.target.value})}
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-cyan-300"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">TIME</label>
                <input
                  type="time"
                  value={editingReminder.time}
                  onChange={(e) => setEditingReminder({...editingReminder, time: e.target.value})}
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-cyan-300"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">DAYS</label>
                <div className="flex justify-between">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <button 
                      key={index}
                      onClick={() => {
                        const newDays = editingReminder.days.includes(index) 
                          ? editingReminder.days.filter(d => d !== index)
                          : [...editingReminder.days, index];
                        setEditingReminder({...editingReminder, days: newDays});
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        editingReminder.days.includes(index) 
                          ? 'bg-cyan-900 border-cyan-600 text-cyan-300' 
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              {editingReminder.id ? (
                <button 
                  onClick={() => deleteReminder(editingReminder.id)}
                  className="bg-red-900/30 text-red-400 border border-red-800 px-3 py-1 rounded text-xs hover:bg-red-900/50 transition"
                >
                  DELETE
                </button>
              ) : (
                <button 
                  onClick={() => setShowModal(false)}
                  className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-700 transition"
                >
                  CANCEL
                </button>
              )}
              
              <button 
                onClick={() => saveReminder(editingReminder)}
                className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-3 py-1 rounded text-xs hover:bg-cyan-800 transition"
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