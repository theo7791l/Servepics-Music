
/// <reference types="vite/client" />

interface Window {
  electron?: {
    logAudio?: (message: string) => void;
    updateDiscordPresence?: (data: { title: string; artist: string }) => void;
    openExternal?: (url: string) => void;
    getPlatform?: () => Promise<string>;
    minimize?: () => void;
    maximize?: () => void;
    close?: () => void;
  };
}
