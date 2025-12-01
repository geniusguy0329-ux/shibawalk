import React, { useState, useEffect } from 'react';
import AutoTracker from './components/AutoTracker';
import ManualEntry from './components/ManualEntry';
import HistoryList from './components/HistoryList';
import FootprintMap from './components/FootprintMap';
import SettingsModal from './components/SettingsModal';
import { WalkRecord, FirebaseConfig } from './types';
import { STORAGE_KEYS } from './constants';
import { initFirebase, saveRecordToCloud, subscribeToWalks, isFirebaseInitialized } from './services/firebaseService';
import { Dog, PenTool, History, Map as MapIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'history' | 'map'>('auto');
  const [history, setHistory] = useState<WalkRecord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Load local data and config on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedConfig = localStorage.getItem('hiro_firebase_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setFirebaseConfig(config);
        const success = initFirebase(config);
        setIsCloudConnected(success);
      } catch (e) {
        console.error("Config load error", e);
      }
    }
  }, []);

  // Subscribe to Cloud Updates if connected
  useEffect(() => {
    if (isCloudConnected) {
      const unsubscribe = subscribeToWalks((cloudRecords) => {
        // Merge strategy: Cloud is source of truth, but we keep local-only records if any (optional)
        // Here we'll simply trust the cloud query which returns latest 100
        // But to be safe, we merge with local IDs to avoid flashing or losing offline data immediately
        
        setHistory(prevLocal => {
          const cloudIds = new Set(cloudRecords.map(r => r.id));
          // Keep local records that are NOT in cloud yet (maybe offline created)
          const localOnly = prevLocal.filter(r => !cloudIds.has(r.id));
          const merged = [...cloudRecords, ...localOnly].sort((a, b) => b.startTime - a.startTime);
          
          // Update local storage to match cloud
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
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
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
    
    // 2. Save Cloud (if connected)
    if (isCloudConnected) {
      try {
        await saveRecordToCloud(record);
        console.log("Saved to cloud successfully");
      } catch (e) {
        console.error("Failed to save to cloud", e);
        alert("⚠️ 儲存到本機成功，但上傳雲端失敗 (請檢查網路)");
      }
    }

    setActiveTab('history');
  };

  const handleSaveConfig = (config: FirebaseConfig) => {
    setFirebaseConfig(config);
    localStorage.setItem('hiro_firebase_config', JSON.stringify(config));
    const success = initFirebase(config);
    setIsCloudConnected(success);
    if (success) {
      alert("✅ 雲端連線成功！正在同步資料...");
    } else {
      alert("❌ 連線失敗，請檢查設定碼是否正確。");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-800 font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onSave={handleSaveConfig}
          initialConfig={firebaseConfig || undefined}
        />
      )}

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
               isCloudConnected={isCloudConnected}
               onOpenSettings={() => setShowSettings(true)}
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