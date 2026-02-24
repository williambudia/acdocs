// iOS Safari compatibility fixes

export function initIOSCompat() {
  if (typeof window === 'undefined') return;

  // Fix para Date parsing no Safari
  const originalDateParse = Date.parse;
  Date.parse = function(dateString: string) {
    // Safari tem problemas com alguns formatos de data
    // Converte "YYYY-MM-DD HH:mm:ss" para formato ISO
    if (typeof dateString === 'string' && dateString.includes(' ')) {
      dateString = dateString.replace(' ', 'T');
    }
    return originalDateParse.call(this, dateString);
  };

  // Garantir que localStorage está disponível
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
  } catch (e) {
    console.warn('localStorage not available, using memory fallback');
    
    // Fallback em memória
    const memoryStorage: Record<string, string> = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => { memoryStorage[key] = value; },
        removeItem: (key: string) => { delete memoryStorage[key]; },
        clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]); },
        key: (index: number) => Object.keys(memoryStorage)[index] || null,
        get length() { return Object.keys(memoryStorage).length; }
      },
      writable: false,
      configurable: false
    });
  }

  // Log do ambiente para debug
  console.log('iOS Compat initialized', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    hasLocalStorage: !!window.localStorage,
    hasSessionStorage: !!window.sessionStorage,
  });
}
