// electron/preload.js
// Safe preload script exposing minimal, secure APIs to renderer if needed.

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('campusFindApp', {
  platform: process.platform,
  version: '1.0.0'
});

