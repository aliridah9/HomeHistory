// Polyfills and global definitions
// This file must be imported first in main.tsx

// Type declaration for Node.js global
declare const global: any;

// Define global clear function to prevent Vite errors
(function() {
  'use strict';
  
  const clearFunction = () => {
    if (typeof console !== 'undefined' && console.clear) {
      console.clear();
    }
  };
  
  // Define on globalThis (modern browsers)
  if (typeof globalThis !== 'undefined' && !(globalThis as any).clear) {
    (globalThis as any).clear = clearFunction;
  }
  
  // Define on window (browser)
  if (typeof window !== 'undefined' && !(window as any).clear) {
    (window as any).clear = clearFunction;
  }
  
  // Define on global (Node.js)
  if (typeof global !== 'undefined' && !(global as any).clear) {
    (global as any).clear = clearFunction;
  }
  
  // Define on self (web workers)
  if (typeof self !== 'undefined' && !(self as any).clear) {
    (self as any).clear = clearFunction;
  }
})();

// Export to ensure this module is loaded
export {};
