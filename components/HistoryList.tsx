import React, { useState } from 'react';
import { WalkRecord } from '../types';
import { Clock, MapPin, User, ChevronDown, Sparkles, BarChart3, X } from 'lucide-react';
import StatisticsPanel from './StatisticsPanel';

interface Props {
  records: WalkRecord[];
}

const HistoryList: React.FC<Props> = ({ records }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Sort by date desc
  const sortedRecords = [...records].sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn relative">
      
      {/* Stats Toggle Button */}
      {records.length > 0 && (
        <button
          onClick={() => setShowStats(!showStats)}
          className={`
            w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-sm
            ${showStats 
              ? 'bg-stone-200 text-stone-600' 
              : 'bg-white text-orange-600 border border-orange-100 shadow-orange-50'}
          `}
        >
          {showStats ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
          {showStats ? '收起統計' : '查看散步統計與榮譽榜'}
        </button>
      )}

      {/* Statistics Panel */}
      {showStats && (
         <StatisticsPanel records={records} />
      )}

      {/* List Header */}
      <div className="flex items-center justify-between px-2 pt-2">
         <h3 className="font-black text-stone-600 text-lg">歷史紀錄 ({sortedRecords.length})</h3>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <div className="text-6xl mb-4 opacity-30">🐕</div>
          <p className="font-bold text-lg">還沒有散步紀錄喔！</p>
          <p className="text-sm mt-2">快帶柴神去巡視領土吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecords.map((record) => {
            const isExpanded = expandedId === record.id;
            const date = new Date(record.startTime);
            const dateStr = date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' });
            const timeStr = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={record.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden transition-all duration-300">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-stone-50"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2
                      ${record.hasPooped 
                        ? 'bg-orange-50 border-orange-100 text-orange-500' 
                        : 'bg-stone-50 border-stone-100 text-stone-400'
                      }
                    `}>
                      {record.mood.split(' ')[1] || '🐕'}
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 text-lg flex items-center gap-2">
                        {dateStr}
                      </div>
                      <div className="text-sm text-stone-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-xs font-bold text-stone-600">
                           {record.mode === 'Auto' ? '自動' : '補登'}
                        </span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
                        <span className="flex items-center gap-1 font-bold text-orange-600">
                           {Math.floor(record.durationSeconds / 60)} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-stone-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 bg-stone-50/30 border-t border-stone-100 animate-slideIn">
                    <div className="mt-4 space-y-4">
                      {/* Walkers */}
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-stone-100">
                           <User className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-stone-400 mb-1">領路者</div>
                          <div className="flex flex-wrap gap-2">
                             {record.walkers.map((w, i) => (
                               <span key={i} className="bg-stone-200 text-stone-700 px-2 py-1 rounded-lg text-sm font-bold">
                                 {w}
                               </span>
                             ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Route */}
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-stone-100">
                           <MapPin className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                           <div className="text-xs font-bold text-stone-400 mb-1">路線</div>
                           <p className="text-stone-700 font-medium leading-relaxed">
                              {record.mode === 'Auto' 
                                ? '🚩 GPS 追蹤紀錄 (請查看足跡地圖)' 
                                : record.manualRouteDescription}
                           </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="text-xs font-bold text-stone-400 mb-1">柴神心情</div>
                            <div className="text-lg font-black text-stone-700">{record.mood}</div>
                         </div>
                         <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="text-xs font-bold text-stone-400 mb-1">黃金產出</div>
                            <div className={`text-lg font-black ${record.hasPooped ? 'text-orange-600' : 'text-stone-400'}`}>
                               {record.hasPooped ? record.poopCondition : '無'}
                            </div>
                         </div>
                      </div>
                      
                      {/* Notes */}
                      {record.notes && (
                         <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-900 font-medium">
                            {record.notes}
                         </div>
                      )}

                      {/* AI Diary */}
                      {record.aiDiaryEntry && (
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-3xl text-white shadow-lg shadow-orange-200 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-20">
                              <Sparkles className="w-16 h-16" />
                           </div>
                           <h4 className="font-black text-orange-100 mb-3 text-sm uppercase tracking-widest flex items-center gap-2">
                              <span className="text-xl">🐕</span> Hiro's Diary
                           </h4>
                           <p className="text-white/95 font-medium leading-loose text-justify font-serif tracking-wide">
                             {record.aiDiaryEntry}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryList;