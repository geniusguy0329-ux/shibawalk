import React, { useState, useEffect } from 'react';
import AutoTracker from './components/AutoTracker';
import ManualEntry from './components/ManualEntry';
import HistoryList from './components/HistoryList';
import FootprintMap from './components/FootprintMap';
import { WalkRecord } from './types';
import { STORAGE_KEYS, DEFAULT_FIREBASE_CONFIG } from './constants';
import { initFirebase, saveRecordToCloud, subscribeToWalks } from './services/firebaseService';
import { Dog, PenTool, History, Map as MapIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'history' | 'map'>('auto');
  const [history, setHistory] = useState<WalkRecord[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Load local data and init Firebase on mount
  useEffect(() => {
    // 1. Load Local Storage
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // 2. Init Firebase automatically
    try {
      const success = initFirebase(DEFAULT_FIREBASE_CONFIG);
      setIsCloudConnected(success);
      if (success) {
        console.log("Firebase initialized successfully");
      }
    } catch (e) {
      console.error("Firebase init error", e);
    }
  }, []);

  // Subscribe to Cloud Updates if connected
  useEffect(() => {
    if (isCloudConnected) {
      const unsubscribe = subscribeToWalks((cloudRecords) => {
        setHistory(prevLocal => {
          const cloudIds = new Set(cloudRecords.map(r => r.id));
          // Keep local records that are NOT in cloud yet (maybe offline created)
          const localOnly = prevLocal.filter(r => !cloudIds.has(r.id));
          const merged = [...cloudRecords, ...localOnly].sort((a, b) => b.startTime - a.startTime);
          
          // Update local storage to match cloud
          try {
             localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
          } catch (e) {
             console.error("Failed to save history to local storage (cloud sync)", e);
          }
          return merged;
        });
      });
      return () => unsubscribe();
    }
  }, [isCloudConnected]);

  const saveRecord = async (record: WalkRecord) => {
    // 1. Save Local (Optimistic UI)
    const newHistory = [record, ...history];
    setHistory(newHistory);
    
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history to local storage", e);
      // We continue to try saving to cloud even if local storage fails
    }
    
    // 2. Save Cloud (if connected)
    if (isCloudConnected) {
      try {
        await saveRecordToCloud(record);
        console.log("Saved to cloud successfully");
      } catch (e) {
        console.error("Failed to save to cloud", e);
        // Silent fail is okay, local storage has it (hopefully).
      }
    }

    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-800 font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-800">
            與柴神Hiro <span className="text-orange-500">散步＆回家</span>
          </h1>
          <p className="text-xs text-stone-400">今天的領土巡視狀況如何呢？</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {activeTab === 'auto' && (
          <div className="p-4 flex-1">
             <AutoTracker onSave={saveRecord} />
          </div>
        )}
        {activeTab === 'manual' && (
           <div className="p-4 flex-1">
             <ManualEntry onSave={saveRecord} />
           </div>
        )}
        {activeTab === 'history' && (
           <div className="p-4 flex-1">
             <HistoryList 
               records={history} 
             />
           </div>
        )}
        {activeTab === 'map' && (
           <div className="flex-1 h-full">
             <FootprintMap records={history} />
           </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-100 px-4 py-3 flex justify-between items-center text-xs font-medium sticky bottom-0 z-20 pb-safe">
        <button
          onClick={() => setActiveTab('auto')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
            activeTab === 'auto' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl ${activeTab === 'auto' ? 'bg-orange-50' : ''}`}>
            <Dog className="w-5 h-5" />
          </div>
          <span>自動</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
            activeTab === 'manual' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl ${activeTab === 'manual' ? 'bg-orange-50' : ''}`}>
             <PenTool className="w-5 h-5" />
          </div>
          <span>補登</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
            activeTab === 'history' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl ${activeTab === 'history' ? 'bg-orange-50' : ''}`}>
            <History className="w-5 h-5" />
          </div>
          <span>紀錄</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
            activeTab === 'map' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl ${activeTab === 'map' ? 'bg-orange-50' : ''}`}>
            <MapIcon className="w-5 h-5" />
          </div>
          <span>足跡</span>
        </button>
      </nav>
      
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;