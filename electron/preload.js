// electron/preload.js
// Safe preload script exposing minimal, secure APIs to renderer.

const { contextBridge } = require('electron');

// Expose safe platform info and optionally injected hosted API URL
contextBridge.exposeInMainWorld('campusFindApp', {
  platform: process.platform,
  version: '1.0.0',
  hostedApiUrl: process.env.CAMPUSFIND_API_URL || null,
});

if (process.env.CAMPUSFIND_API_URL) {
  window.CAMPUSFIND_API_URL = process.env.CAMPUSFIND_API_URL;
}
