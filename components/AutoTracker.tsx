import React, { useState, useEffect, useRef } from 'react';
import { WalkFormData, Coordinates, WalkRecord, WalkMode } from '../types';
import WalkerSelector from './WalkerSelector';
import WalkDetailsForm from './WalkDetailsForm';
import { DEFAULT_WALKERS } from '../constants';
import { Play, Square, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { generateWalkDiary } from '../services/geminiService';

interface Props {
  onSave: (record: WalkRecord) => void;
}

// Key for saving active walk state to survive page reloads/background kills
const ACTIVE_WALK_KEY = 'hiro_active_walk_state';

interface ActiveWalkState {
  startTime: number;
  walkers: string[];
  coordinates: Coordinates[];
}

// Custom SVG for Chinese Gold Ingot (Sycee/Yuanbao)
const GoldIngotIcon = ({ className, delay }: { className?: string, delay?: string }) => (
  <svg 
    viewBox="0 0 64 48" 
    className={`${className} drop-shadow-md`} 
    style={{ animationDelay: delay }}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base of the ingot */}
    <path d="M4 24 C4 42 32 46 60 24 L54 16 H10 L4 24 Z" fill="#F59E0B" /> {/* Darker Gold/Orange base */}
    <path d="M8 24 C8 38 32 42 56 24" stroke="#D97706" strokeWidth="2" strokeLinecap="round" /> {/* Shadow line */}
    
    {/* Top part */}
    <path d="M10 16 L18 8 H46 L54 16 H10 Z" fill="#FBBF24" /> {/* Medium Gold */}
    
    {/* Center bump */}
    <ellipse cx="32" cy="12" rx="12" ry="6" fill="#FDE68A" /> {/* Highlight Gold */}
    <ellipse cx="32" cy="12" rx="8" ry="3" fill="#FFFBEB" fillOpacity="0.6" /> {/* Shine */}
  </svg>
);

const AutoTracker: React.FC<Props> = ({ onSave }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedWalkers, setSelectedWalkers] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [showFinishForm, setShowFinishForm] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  
  // Loading State
  const [isSaving, setIsSaving] = useState(false);
  
  // Finish Form Data
  const [details, setDetails] = useState<WalkFormData>({
    mood: '開心 🐕',
    hasPooped: false,
    poopCondition: undefined,
    notes: ''
  });
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null); // Reference for Screen Wake Lock

  // 1. Initialize: Check if we need to restore a walk from background/refresh
  useEffect(() => {
    const savedStateStr = localStorage.getItem(ACTIVE_WALK_KEY);
    if (savedStateStr) {
      try {
        const savedState: ActiveWalkState = JSON.parse(savedStateStr);
        // Restore state
        setIsTracking(true);
        setStartTime(savedState.startTime);
        setSelectedWalkers(savedState.walkers);
        setCoordinates(savedState.coordinates || []);
        
        // Immediately calculate correct duration (Time Diff Strategy)
        const now = Date.now();
        setDuration(Math.floor((now - savedState.startTime) / 1000));
        
        console.log("Restored active walk from storage");
      } catch (e) {
        console.error("Failed to restore walk state", e);
        localStorage.removeItem(ACTIVE_WALK_KEY);
      }
    }
    
    return () => {
      cleanupTracking();
    };
  }, []);

  // 2. Tracking Effect: Handle Timer, GPS, WakeLock, and Persistence
  useEffect(() => {
    if (isTracking && startTime) {
      // A. Request Wake Lock (Keep screen/CPU alive)
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            // @ts-ignore
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
          }
        } catch (err) {
          console.warn('Wake Lock failed:', err);
        }
      };
      requestWakeLock();

      // B. Start Timer (Time Diff Strategy)
      // We calculate (Now - Start) every second, so even if backgrounding pauses the timer,
      // the moment it wakes up, the duration jumps to the correct value.
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const secondsElapsed = Math.floor((now - startTime) / 1000);
        setDuration(secondsElapsed);
      }, 1000);

      // C. Start GPS
      if ('geolocation' in navigator) {
         watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newCoord: Coordinates = {
              latitude: Number(position.coords.latitude),
              longitude: Number(position.coords.longitude),
              timestamp: Number(position.timestamp)
            };
            
            setCoordinates(prev => {
              const updated = [...prev, newCoord];
              // Save to local storage for persistence (only save every update to avoid spamming if needed, but safe for small arrays)
              saveStateToStorage(startTime, selectedWalkers, updated);
              return updated;
            });
            setGpsError(null);
          },
          (error) => {
            console.error("GPS Error", error);
            setGpsError("無法取得 GPS (請檢查權限)");
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        setGpsError("裝置不支援 GPS");
      }
    } else {
      // Not tracking
      cleanupTracking();
    }
  }, [isTracking, startTime]); // Re-run if tracking starts

  // Helper to persist state
  const saveStateToStorage = (start: number, walkers: string[], coords: Coordinates[]) => {
    const state: ActiveWalkState = {
      startTime: start,
      walkers: walkers,
      coordinates: coords
    };
    localStorage.setItem(ACTIVE_WALK_KEY, JSON.stringify(state));
  };

  const cleanupTracking = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }
    // Release Wake Lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      });
    }
  };

  const startWalk = () => {
    setGpsError(null);
    if (selectedWalkers.length === 0) return;

    const start = Date.now();
    setStartTime(start);
    setCoordinates([]);
    setDuration(0);
    
    // Save initial state immediately
    saveStateToStorage(start, selectedWalkers, []);
    
    setIsTracking(true);
  };

  const handleStopClick = () => {
    setShowStopConfirm(true);
  };

  const handleConfirmStop = () => {
    setShowStopConfirm(false);
    cleanupTracking();
    setIsTracking(false);
    setShowFinishForm(true);
    
    // Clear persisted state as walk is finished
    localStorage.removeItem(ACTIVE_WALK_KEY);
  };

  const handleCancelStop = () => {
    setShowStopConfirm(false);
  };

  const handleFinalSave = async () => {
    if (!startTime || isSaving) return;

    setIsSaving(true); // Start loading

    try {
      let allWalkers = DEFAULT_WALKERS;
      try {
          const saved = localStorage.getItem('hiro_walkers_v1');
          if (saved) allWalkers = JSON.parse(saved);
      } catch(e) {}

      const walkerNames = selectedWalkers.map(id => {
         const w = allWalkers.find((aw: any) => aw.id === id);
         return w ? w.name : 'Unknown';
      });

      const cleanCoordinates = coordinates.map(c => ({
        latitude: c.latitude,
        longitude: c.longitude,
        timestamp: c.timestamp
      }));

      const record: WalkRecord = {
        id: Date.now().toString(),
        mode: WalkMode.AUTO,
        walkers: [...walkerNames],
        startTime: startTime,
        endTime: Date.now(),
        durationSeconds: duration,
        routeCoordinates: cleanCoordinates,
        mood: details.mood,
        hasPooped: details.hasPooped,
        poopCondition: details.poopCondition,
        notes: details.notes,
        date: new Date(startTime).toISOString(),
      };

      // Generate AI Diary (Takes time)
      const diary = await generateWalkDiary(record);
      record.aiDiaryEntry = diary;

      onSave(record);
      
      // Reset
      setShowFinishForm(false);
      setDuration(0);
      setStartTime(null);
      setCoordinates([]);
      setDetails({ mood: '開心 🐕', hasPooped: false, notes: '' });
      setSelectedWalkers([]);
      setGpsError(null);
      localStorage.removeItem(ACTIVE_WALK_KEY); // Double check cleanup
    } catch (error) {
      console.error("Save error:", error);
      alert("儲存時發生錯誤，請重試");
    } finally {
      setIsSaving(false); // Stop loading
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (showFinishForm) {
    return (
      <div className="animate-slideIn relative">
        <h2 className="text-3xl font-black text-stone-800 mb-6 flex items-center gap-3">
          <span className="text-4xl">🏁</span>
          <span className="text-orange-600">散步結算</span>
        </h2>
        
        <div className="bg-orange-100 border-4 border-orange-200 p-6 rounded-3xl mb-8 text-center shadow-lg transform rotate-1">
             <div className="text-stone-600 text-lg font-bold mb-2">本次巡視時長</div>
             <div className="text-5xl font-black text-orange-600 font-mono tracking-tighter drop-shadow-sm">
                {formatTime(duration)}
             </div>
        </div>

        <WalkDetailsForm data={details} onChange={setDetails} />
        
        <button
          onClick={handleFinalSave}
          disabled={isSaving}
          className={`
            w-full mt-8 py-5 rounded-2xl font-bold text-2xl shadow-xl transition-all flex items-center justify-center gap-2
            ${isSaving 
              ? 'bg-stone-400 text-stone-200 cursor-wait' 
              : 'bg-stone-800 text-white active:scale-95'
            }
          `}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>柴神撰寫日記中...</span>
            </>
          ) : (
            <span>📜 完成並寫日記</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border-4 border-orange-100 text-center transform scale-105">
                <div className="text-6xl mb-4 animate-bounce">
                   🏠
                </div>
                <h3 className="text-2xl font-black text-stone-800 mb-2">要回宮了嗎？</h3>
                <p className="text-stone-500 text-lg mb-8 font-medium">
                    柴神看起來還很想走呢...<br/>確定要結束紀錄？
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleCancelStop}
                        className="w-full py-4 rounded-2xl bg-stone-100 text-stone-600 font-bold text-lg hover:bg-stone-200 transition-colors"
                    >
                        再走一下好了
                    </button>
                    <button 
                        onClick={handleConfirmStop}
                        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
                    >
                        是，恭送回宮
                    </button>
                </div>
            </div>
        </div>
      )}

      {!isTracking ? (
        <div className="space-y-8 animate-fadeIn flex flex-col items-center">
          
          <div className="text-center pt-6 pb-2 w-full">
             <div className="text-8xl mb-4 filter drop-shadow-md animate-bounce">
               🐕
             </div>
             <h2 className="text-4xl font-black text-stone-800 tracking-wider mb-2">
               柴神出巡
             </h2>
             <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold">
                今天也要巡視領土！
             </div>
          </div>

          <div className="w-full">
             <div className="text-center mb-4">
               <p className="text-stone-500 text-lg font-bold">👇 請選擇陪同的鏟屎官</p>
             </div>
             <WalkerSelector selectedWalkerIds={selectedWalkers} onChange={setSelectedWalkers} />
          </div>

          {gpsError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-r-xl w-full text-base font-bold flex items-center gap-3 shadow-sm">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              {gpsError}
            </div>
          )}

          <div className="w-full pt-4">
            <button
              onClick={startWalk}
              disabled={selectedWalkers.length === 0}
              className={`
                w-full py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 transition-all transform
                ${selectedWalkers.length > 0 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 shadow-xl active:scale-95 cursor-pointer hover:-translate-y-1' 
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              {selectedWalkers.length > 0 ? (
                  <>
                    <Play fill="currentColor" size={28} />
                    <span>出發！</span>
                  </>
              ) : (
                  '請先選擇領路者'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-fadeIn py-10">
          
          <div className="text-center space-y-2">
             <div className="text-2xl font-bold text-stone-600">柴神賜福中...</div>
             <div className="flex justify-center gap-3 mt-4">
                <GoldIngotIcon className="w-12 h-12 animate-bounce" delay="75ms" />
                <GoldIngotIcon className="w-12 h-12 animate-bounce" delay="150ms" />
                <GoldIngotIcon className="w-12 h-12 animate-bounce" delay="300ms" />
             </div>
          </div>

          <div className="relative mt-4">
            <div className="absolute inset-0 bg-orange-300 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative w-72 h-72 bg-white rounded-full border-[10px] border-orange-100 shadow-2xl flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-500">
              <span className="text-stone-400 text-base font-bold uppercase tracking-widest mb-2">TIME</span>
              <span className="text-6xl font-mono font-black text-stone-800 tracking-tighter">
                {formatTime(duration)}
              </span>
              <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full">
                 <MapPin className={`w-5 h-5 ${!gpsError ? 'animate-bounce text-green-500' : 'text-red-500'}`} />
                 <span className={`text-sm font-bold ${gpsError ? 'text-red-500' : 'text-stone-600'}`}>
                    {gpsError ? 'GPS迷路中' : '足跡紀錄中'}
                 </span>
              </div>
            </div>
          </div>

          <div className="w-full px-8">
             <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border-2 border-white shadow-sm text-center">
                <p className="text-stone-500 font-bold mb-1">隨行僕人</p>
                <div className="flex justify-center flex-wrap gap-2">
                    {selectedWalkers.map(id => {
                        const saved = localStorage.getItem('hiro_walkers_v1');
                        const list = saved ? JSON.parse(saved) : DEFAULT_WALKERS;
                        const w = list.find((x: any) => x.id === id);
                        return w ? (
                            <span key={id} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                                {w.name}
                            </span>
                        ) : null;
                    })}
                </div>
             </div>
          </div>

          <button
            onClick={handleStopClick}
            className="w-full max-w-sm bg-red-500 hover:bg-red-600 text-white py-5 rounded-3xl font-black text-2xl shadow-red-200 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 mt-auto"
          >
            <Square fill="currentColor" size={24} />
            結束散步
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoTracker;