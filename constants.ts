import { Walker, FirebaseConfig } from './types';

export const DEFAULT_WALKERS: Walker[] = [
  { id: '1', name: '仁駿', isDefault: true },
  { id: '2', name: 'Hugo', isDefault: true },
  { id: '3', name: '駿家人', isDefault: true },
  { id: '4', name: '瑋家人', isDefault: true },
  { id: '5', name: '熊貓乾媽', isDefault: true },
  { id: '6', name: '美女姊姊', isDefault: true },
];

export const MOOD_OPTIONS = ['開心 🐕', '平靜 😐', '興奮 🌪️', '懶散 💤', '生氣 💢'];

export const STORAGE_KEYS = {
  WALKERS: 'hiro_walkers_v1',
  HISTORY: 'hiro_history_v1',
};

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBf-ElHlED4udhaMRbZDrqdEZoITjxvjYw",
  authDomain: "shibawalk-d6e15.firebaseapp.com",
  projectId: "shibawalk-d6e15",
  storageBucket: "shibawalk-d6e15.firebasestorage.app",
  messagingSenderId: "748888304974",
  appId: "1:748888304974:web:e89d3fa90957ce1fb3821f"
};