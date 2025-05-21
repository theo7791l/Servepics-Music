
/// <reference types="vite/client" />

// Type pour l'objet electron exposé via contextBridge
interface ElectronAPI {
  logAudio?: (message: string) => void;
  updateDiscordPresence?: (data: { title: string; artist: string }) => void;
  openExternal?: (url: string) => void;
  getPlatform?: () => Promise<string>;
  minimize?: () => void;
  maximize?: () => void;
  close?: () => void;
}

// This resolves the TypeScript error by properly declaring the window.electron property
interface Window {
  electron?: ElectronAPI;
}

// No need for the nested interface declaration that was causing the issue
