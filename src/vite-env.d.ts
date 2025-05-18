
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

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
