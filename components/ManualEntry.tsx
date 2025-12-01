import React, { useState } from 'react';
import { WalkFormData, WalkRecord, WalkMode } from '../types';
import WalkerSelector from './WalkerSelector';
import WalkDetailsForm from './WalkDetailsForm';
import { DEFAULT_WALKERS } from '../constants';
import { Calendar, Save, Map, Clock } from 'lucide-react';
import { generateWalkDiary } from '../services/geminiService';

interface Props {
  onSave: (record: WalkRecord) => void;
}

const ManualEntry: React.FC<Props> = ({ onSave }) => {
  const [selectedWalkers, setSelectedWalkers] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [durationMins, setDurationMins] = useState(30);
  const [routeDesc, setRouteDesc] = useState('');
  
  const [details, setDetails] = useState<WalkFormData>({
    mood: '平靜 😐',
    hasPooped: false,
    poopCondition: undefined,
    notes: ''
  });

  const handleSave = async () => {
    if (selectedWalkers.length === 0) {
      alert("請選擇領路者");
      return;
    }
    if (!routeDesc.trim()) {
      alert("請填寫散步路線");
      return;
    }

    const allWalkers = JSON.parse(localStorage.getItem('hiro_walkers_v1') || JSON.stringify(DEFAULT_WALKERS));
    const walkerNames = selectedWalkers.map(id => {
       const w = allWalkers.find((aw: any) => aw.id === id);
       return w ? w.name : 'Unknown';
    });

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

    const record: WalkRecord = {
      id: Date.now().toString(),
      mode: WalkMode.MANUAL,
      walkers: walkerNames,
      startTime: startDateTime.getTime(),
      endTime: endDateTime.getTime(),
      durationSeconds: durationMins * 60,
      manualRouteDescription: routeDesc,
      mood: details.mood,
      hasPooped: details.hasPooped,
      poopCondition: details.poopCondition,
      notes: details.notes,
      date: startDateTime.toISOString(),
    };

    const diary = await generateWalkDiary(record);
    record.aiDiaryEntry = diary;

    onSave(record);
    
    // Reset form
    setSelectedWalkers([]);
    setRouteDesc('');
    setDetails({ mood: '平靜 😐', hasPooped: false, notes: '' });
    alert("補登成功！");
  };

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center pb-2">
         <h2 className="text-3xl font-black text-stone-800 flex items-center justify-center gap-3">
           <span className="text-4xl">📝</span>
           補寫日記
         </h2>
         <p className="text-stone-400 font-bold mt-1">忘記紀錄了嗎？沒關係的！</p>
      </div>

      {/* Date & Time */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
        <h3 className="text-xl font-black text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Calendar className="w-6 h-6 text-orange-500" />
          時間與日期
        </h3>
        
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-stone-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-orange-200 transition-colors">
            <label className="text-stone-500 font-bold mb-2 block">日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-stone-800 focus:outline-none"
            />
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-orange-200 transition-colors">
            <label className="text-stone-500 font-bold mb-2 block">開始時間</label>
            <input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-stone-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Duration Slider */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
         <label className="text-xl font-black text-stone-700 flex items-center gap-2">
             <Clock className="w-6 h-6 text-orange-500" />
             散步時長
         </label>
         
         <div className="bg-orange-50 p-6 rounded-3xl text-center border-2 border-orange-100">
             <div className="text-6xl font-black text-orange-500 font-mono mb-2 flex justify-center items-end gap-2">
                 {durationMins}
                 <span className="text-xl text-orange-400 font-bold pb-4">分鐘</span>
             </div>
             <input 
                type="range" 
                min="5" 
                max="120" 
                step="5"
                value={durationMins} 
                onChange={(e) => setDurationMins(parseInt(e.target.value))}
                className="w-full h-4 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
             />
             <div className="flex justify-between text-stone-400 text-sm font-bold mt-2 px-1">
                 <span>5分</span>
                 <span>1小時</span>
                 <span>2小時</span>
             </div>
         </div>
      </div>

      {/* Route */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
           <label className="text-xl font-black text-stone-700 flex items-center gap-2">
             <Map className="w-6 h-6 text-orange-500" />
             散步路線
           </label>
           <textarea 
              value={routeDesc} 
              onChange={(e) => setRouteDesc(e.target.value)}
              placeholder="例如：家 -> 公園 -> 全家 -> 家"
              className="w-full bg-stone-50 rounded-2xl p-4 text-xl font-medium border-2 border-transparent focus:bg-white focus:border-orange-300 transition-all outline-none resize-none h-32"
           />
      </div>

      {/* Walkers */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
         <WalkerSelector selectedWalkerIds={selectedWalkers} onChange={setSelectedWalkers} />
      </div>

      {/* Details Form (Mood/Poop) */}
      <WalkDetailsForm data={details} onChange={setDetails} />

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-stone-800 text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-stone-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
      >
        <Save className="w-8 h-8" />
        補登紀錄
      </button>
    </div>
  );
};

export default ManualEntry;