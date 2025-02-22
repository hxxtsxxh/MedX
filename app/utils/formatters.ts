export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Add a new function to store time in 24h format but display in 12h
export const storeTime = (hours: number, minutes: number): string => {
  // Store in 24-hour format for proper sorting and comparison
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const displayTime = (time: string): string => {
  return formatTime(time);
};

export const getDosageUnit = (medicationName: string): string => {
  const liquidMeds = ['syrup', 'solution', 'suspension', 'liquid', 'elixir'];
  const inhalerMeds = ['inhaler', 'aerosol', 'hfa'];
  const dropMeds = ['drops', 'eye', 'ear', 'nasal'];
  
  const nameLower = medicationName.toLowerCase();
  
  if (liquidMeds.some(term => nameLower.includes(term))) {
    return 'mL';
  }
  if (inhalerMeds.some(term => nameLower.includes(term))) {
    return 'puffs';
  }
  if (dropMeds.some(term => nameLower.includes(term))) {
    return 'drops';
  }
  // Default to mg for most medications
  return 'mg';
};

export const formatDosage = (dosage: string, medicationName: string = ''): string => {
  if (!dosage) return '';
  
  // If dosage already has units, return as is
  if (/[a-zA-Z]/.test(dosage)) {
    return dosage;
  }
  
  // Add appropriate unit based on medication name
  const unit = getDosageUnit(medicationName);
  return `${dosage}${unit}`;
};

export const getNextDoseDay = (scheduledDays: string[], frequency: string): number => {
  const today = new Date();
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentDate = today.getDate();
  
  if (frequency === 'weekly') {
    // Get number representation of days (0 = Sunday, 1 = Monday, etc.)
    const dayToNumber = (day: string): number => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return days.indexOf(day.toLowerCase());
    };
    
    const todayNumber = dayToNumber(currentDay);
    const scheduledDayNumbers = scheduledDays.map(dayToNumber);
    
    // Find the next scheduled day
    const nextDay = scheduledDayNumbers.find(day => day > todayNumber);
    if (nextDay !== undefined) {
      return nextDay - todayNumber;
    }
    // If no days left this week, get days until first scheduled day next week
    return 7 - todayNumber + scheduledDayNumbers[0];
  }
  
  if (frequency === 'monthly') {
    const scheduledDates = scheduledDays.map(Number).sort((a, b) => a - b);
    const nextDate = scheduledDates.find(date => date > currentDate);
    
    if (nextDate !== undefined) {
      return nextDate - currentDate;
    }
    // If no dates left this month, calculate days until first date next month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return daysInMonth - currentDate + scheduledDates[0];
  }
  
  return 0; // Return 0 for daily medications
};

export const formatDaysUntil = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}; 

export default formatDaysUntil;
