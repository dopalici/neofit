import { 
  format, 
  parseISO, 
  isValid, 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths,
  addDays,
  isSameDay
} from 'date-fns';

/**
 * Format a date string to a readable format
 * 
 * @param {string} dateString - ISO date string
 * @param {string} formatStr - Format string (e.g., 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, formatStr = 'MMM d, yyyy') {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, formatStr) : '';
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

/**
 * Format time from a date string
 * 
 * @param {string} dateString - ISO date string
 * @param {string} formatStr - Format string (e.g., 'h:mm a')
 * @returns {string} Formatted time string
 */
export function formatTime(dateString, formatStr = 'h:mm a') {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, formatStr) : '';
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }
}

/**
 * Get the start and end dates for a time range
 * 
 * @param {string} range - Time range ('day', 'week', 'month', 'year')
 * @returns {Object} Object with start and end dates
 */
export function getDateRangeForPeriod(range) {
  const endDate = new Date();
  let startDate;
  
  switch (range) {
    case 'day':
      startDate = startOfDay(endDate);
      break;
    case 'week':
      startDate = startOfDay(subDays(endDate, 7));
      break;
    case 'month':
      startDate = startOfDay(subDays(endDate, 30));
      break;
    case 'year':
      startDate = startOfDay(subDays(endDate, 365));
      break;
    default:
      startDate = startOfDay(subDays(endDate, 7));
  }
  
  return {
    startDate,
    endDate: endOfDay(endDate)
  };
}

/**
 * Group health data by date
 * 
 * @param {Array} data - Array of data objects with date property
 * @param {string} period - Group by period ('day', 'week', 'month')
 * @returns {Object} Object with dates as keys and arrays of data as values
 */
export function groupDataByDate(data, period = 'day') {
  if (!data || !Array.isArray(data) || data.length === 0) return {};
  
  const grouped = {};
  
  data.forEach(item => {
    if (!item.date) return;
    
    const date = parseISO(item.date);
    if (!isValid(date)) return;
    
    let groupKey;
    
    switch (period) {
      case 'day':
        groupKey = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        // Use the start of the week as the key
        groupKey = format(date, 'yyyy-w');
        break;
      case 'month':
        groupKey = format(date, 'yyyy-MM');
        break;
      default:
        groupKey = format(date, 'yyyy-MM-dd');
    }
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    
    grouped[groupKey].push(item);
  });
  
  return grouped;
}

/**
 * Generate date labels for a time range
 * 
 * @param {string} range - Time range ('day', 'week', 'month', 'year')
 * @param {number} count - Number of labels to generate
 * @returns {Array} Array of date strings
 */
export function generateDateLabels(range, count = 7) {
  const { startDate, endDate } = getDateRangeForPeriod(range);
  const labels = [];
  
  const daysDiff = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));
  const interval = Math.max(1, Math.ceil(daysDiff / (count - 1)));
  
  for (let i = 0; i < count; i++) {
    const date = addDays(startDate, i * interval);
    
    if (date > endDate) break;
    
    labels.push({
      date,
      label: formatDate(date, 'MMM d')
    });
  }
  
  return labels;
}

/**
 * Find health data for specific dates
 * 
 * @param {Array} data - Array of data objects with date property
 * @param {Array} dates - Array of dates to find data for
 * @returns {Array} Array of data values for each date
 */
export function findDataForDates(data, dates) {
  if (!data || !Array.isArray(data) || data.length === 0 || !dates || !Array.isArray(dates)) {
    return [];
  }
  
  return dates.map(dateObj => {
    const matchingEntries = data.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, dateObj.date);
    });
    
    if (matchingEntries.length === 0) {
      return null;
    }
    
    // If multiple entries for the same day, use average
    if (matchingEntries.length > 1) {
      const sum = matchingEntries.reduce((acc, item) => acc + item.value, 0);
      return sum / matchingEntries.length;
    }
    
    return matchingEntries[0].value;
  });
}