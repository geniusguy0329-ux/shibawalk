import React, { useState } from 'react';
import { X, Cloud, Check, AlertTriangle, Key } from 'lucide-react';
import { FirebaseConfig } from '../types';

interface Props {
  onClose: () => void;
  onSave: (config: FirebaseConfig) => void;
  initialConfig?: FirebaseConfig;
}

const SettingsModal: React.FC<Props> = ({ onClose, onSave, initialConfig }) => {
  const [configStr, setConfigStr] = useState(
    initialConfig ? JSON.stringify(initialConfig, null, 2) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      // Allow users to paste the raw object text (e.g., from JS file)
      // We try to make it valid JSON if they copied keys without quotes
      let jsonStr = configStr;
      
      // Simple heuristic to fix JS object keys to JSON (k: "v" -> "k": "v")
      if (!jsonStr.trim().startsWith('{')) {
         throw new Error("格式錯誤，請確保是 JSON 物件格式 {...}");
      }
      
      // Try parsing
      const config = JSON.parse(jsonStr);
      
      // Validation
      if (!config.apiKey || !config.projectId) {
        throw new Error("設定檔缺少 apiKey 或 projectId");
      }

      onSave(config);
      onClose();
    } catch (e) {
      console.error(e);
      setError("無法解析設定檔，請檢查格式是否正確 (JSON)。");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#fdfbf7] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-white relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 z-10 p-2 bg-white/50 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-stone-800 p-6 text-white pb-10 relative overflow-hidden">
           <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500 rounded-full opacity-20 blur-2xl"></div>
           <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="bg-orange-500 p-2 rounded-xl">
                 <Cloud className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-wider">柴神通行證</h2>
           </div>
           <p className="text-stone-400 text-sm font-medium pl-1">連結雲端，家人共享紀錄</p>
        </div>

        <div className="p-6 -mt-6 bg-[#fdfbf7] rounded-t-3xl relative z-0">
          
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-2xl border-2 border-stone-100 shadow-sm">
                <label className="text-stone-500 font-bold mb-2 flex items-center gap-2 text-sm">
                   <Key className="w-4 h-4" />
                   Firebase 設定碼
                </label>
                <textarea
                  value={configStr}
                  onChange={(e) => {
                      setConfigStr(e.target.value);
                      setError(null);
                  }}
                  placeholder='請貼上 Firebase Config JSON...'
                  className="w-full h-32 text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-orange-300 resize-none text-stone-600"
                />
             </div>

             {error && (
               <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" />
                 {error}
               </div>
             )}

             <div className="bg-stone-100 p-3 rounded-xl">
                <p className="text-xs text-stone-500 leading-relaxed">
                   <strong>如何取得？</strong><br/>
                   請至 Google Firebase Console 建立專案，進入「專案設定」複製 Web App 的 Config 物件 (JSON)。
                </p>
             </div>

             <button
               onClick={handleSave}
               className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Check className="w-5 h-5" />
               連線並儲存
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;