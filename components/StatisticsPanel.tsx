
import React, { useMemo } from 'react';
import { WalkRecord } from '../types';
import { Trophy, Clock, Calendar, Crown, Zap, Moon, Sparkles } from 'lucide-react';

interface Props {
  records: WalkRecord[];
}

interface WalkerStats {
  name: string;
  count: number;
  totalDuration: number; // seconds
  poopCount: number;
  nightWalks: number; // starts after 20:00
}

const StatisticsPanel: React.FC<Props> = ({ records }) => {
  
  // 1. Time Statistics
  const timeStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; // Get current day (1-7), make Sunday 7
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekSeconds = 0;
    let monthSeconds = 0;

    records.forEach(r => {
      const rDate = new Date(r.startTime);
      if (rDate >= startOfWeek) weekSeconds += r.durationSeconds;
      if (rDate >= startOfMonth) monthSeconds += r.durationSeconds;
    });

    return {
      week: Math.floor(weekSeconds / 60), // in minutes
      month: Math.floor(monthSeconds / 60)
    };
  }, [records]);

  // 2. Walker Leaderboard & Badges
  const walkerLeaderboard = useMemo(() => {
    const statsMap: Record<string, WalkerStats> = {};

    records.forEach(r => {
      r.walkers.forEach(name => {
        if (!statsMap[name]) {
          statsMap[name] = { name, count: 0, totalDuration: 0, poopCount: 0, nightWalks: 0 };
        }
        const s = statsMap[name];
        s.count += 1;
        s.totalDuration += r.durationSeconds;
        if (r.hasPooped) s.poopCount += 1;
        
        const hour = new Date(r.startTime).getHours();
        if (hour >= 20 || hour < 5) s.nightWalks += 1;
      });
    });

    return Object.values(statsMap).sort((a, b) => b.count - a.count);
  }, [records]);

  // Determine Badge Holders (Max values)
  const badges = useMemo(() => {
    if (walkerLeaderboard.length === 0) return {};
    
    const findMax = (key: keyof WalkerStats) => {
        const sorted = [...walkerLeaderboard].sort((a, b) => (b[key] as number) - (a[key] as number));
        return sorted[0][key] > 0 ? sorted[0].name : null;
    };

    return {
        mostFrequent: findMax('count'),
        longestDuration: findMax('totalDuration'),
        mostPoop: findMax('poopCount'),
        nightOwl: findMax('nightWalks'),
    };
  }, [walkerLeaderboard]);

  const formatTime = (minutes: number) => {
      if (minutes < 60) return `${minutes} 分鐘`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}小時 ${m}分`;
  };

  if (records.length === 0) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Time Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10">
                <Calendar className="w-16 h-16 text-orange-500" />
            </div>
            <div className="text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span> 本週累計
            </div>
            <div className="text-3xl font-black text-stone-800 tracking-tight">
                {Math.floor(timeStats.week / 60)}<span className="text-sm text-stone-500 font-bold ml-1">小時</span>
                {timeStats.week % 60}<span className="text-sm text-stone-500 font-bold ml-1">分</span>
            </div>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10">
                <Clock className="w-16 h-16 text-stone-500" />
            </div>
            <div className="text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span> 本月累計
            </div>
            <div className="text-3xl font-black text-stone-800 tracking-tight">
                {Math.floor(timeStats.month / 60)}<span className="text-sm text-stone-500 font-bold ml-1">小時</span>
                {timeStats.month % 60}<span className="text-sm text-stone-500 font-bold ml-1">分</span>
            </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100">
         <h3 className="font-black text-stone-700 text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            榮譽榜
         </h3>
         
         <div className="space-y-3">
            {walkerLeaderboard.map((walker, index) => {
                const isFirst = index === 0;
                // Assign badges
                const walkerBadges = [];
                if (badges.mostFrequent === walker.name) walkerBadges.push({ icon: <Crown className="w-3 h-3" />, label: '柴神首選', color: 'bg-yellow-100 text-yellow-700' });
                if (badges.longestDuration === walker.name) walkerBadges.push({ icon: <Zap className="w-3 h-3" />, label: '鐵腿勇者', color: 'bg-red-100 text-red-700' });
                if (badges.mostPoop === walker.name) walkerBadges.push({ icon: <Sparkles className="w-3 h-3" />, label: '黃金獵人', color: 'bg-green-100 text-green-700' });
                if (badges.nightOwl === walker.name) walkerBadges.push({ icon: <Moon className="w-3 h-3" />, label: '守夜人', color: 'bg-indigo-100 text-indigo-700' });

                return (
                    <div key={walker.name} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                ${isFirst ? 'bg-yellow-400 text-white shadow-md' : 'bg-stone-200 text-stone-500'}
                            `}>
                                {index + 1}
                            </div>
                            <div>
                                <div className="font-bold text-stone-700 flex items-center gap-2">
                                    {walker.name}
                                    {walkerBadges.map((b, i) => (
                                        <span key={i} title={b.label} className={`p-1 rounded-full ${b.color}`}>
                                            {b.icon}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs text-stone-400 font-bold mt-0.5">
                                    {walker.count} 次散步・共 {Math.floor(walker.totalDuration / 60)} 分鐘
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
