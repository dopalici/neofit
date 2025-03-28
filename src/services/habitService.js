// Streak data model
const defaultStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckIn: null,
  history: [] // Array of {date, completed}
};

// Check-in data model
const defaultCheckInData = {
  lastCheckIn: null,
  history: [] // Array of {date, type}
};

// Rewards data model
const defaultRewardsData = {
  claimed: [], // Array of {id, date, type}
  available: [] // Array of {id, type, title, description}
};
// Save to localStorage
export function saveHabitData(key, data) {
  try {
    localStorage.setItem(`neo-vitru-${key}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} data:`, error);
    return false;
  }
}

// Load from localStorage
export function loadHabitData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(`neo-vitru-${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} data:`, error);
    return defaultValue;
  }
}