// Global type declarations for HomeHistory web app

// Extend the global Window interface
declare global {
  interface Window {
    clear?: () => void;
  }

  // Extend globalThis interface
  interface GlobalThis {
    clear?: () => void;
  }

  // For Node.js global object
  namespace NodeJS {
    interface Global {
      clear?: () => void;
    }
  }

  // Add any other global variables or functions your app might use
  var clear: (() => void) | undefined;
}

// Ensure this file is treated as a module
export {};
