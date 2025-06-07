export const saveToLocalStorage = (key, value) => {
  try {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(key, serializedState);
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return defaultValue;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage:`, e);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Error removing ${key} from localStorage:`, e);
  }
};