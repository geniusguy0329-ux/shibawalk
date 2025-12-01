import React, { useState, useEffect } from 'react';
import { Walker } from '../types';
import { DEFAULT_WALKERS, STORAGE_KEYS } from '../constants';
import { Plus, X, User } from 'lucide-react';

interface WalkerSelectorProps {
  selectedWalkerIds: string[];
  onChange: (ids: string[]) => void;
}

const WalkerSelector: React.FC<WalkerSelectorProps> = ({ selectedWalkerIds, onChange }) => {
  const [walkers, setWalkers] = useState<Walker[]>(DEFAULT_WALKERS);
  const [isEditing, setIsEditing] = useState(false);
  const [newWalkerName, setNewWalkerName] = useState('');

  // Load walkers from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WALKERS);
    if (saved) {
      setWalkers(JSON.parse(saved));
    }
  }, []);

  // Save walkers to storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALKERS, JSON.stringify(walkers));
  }, [walkers]);

  const toggleSelection = (id: string) => {
    if (selectedWalkerIds.includes(id)) {
      onChange(selectedWalkerIds.filter((wid) => wid !== id));
    } else {
      onChange([...selectedWalkerIds, id]);
    }
  };

  const handleAddWalker = () => {
    if (!newWalkerName.trim()) return;
    const newWalker: Walker = {
      id: Date.now().toString(),
      name: newWalkerName.trim(),
    };
    setWalkers([...walkers, newWalker]);
    setNewWalkerName('');
    setIsEditing(false);
  };

  const handleDeleteWalker = (id: string) => {
    const password = prompt("請輸入密碼以刪除此領路者：");
    if (password === '1234') {
      setWalkers(walkers.filter((w) => w.id !== id));
      // Also remove from selection if selected
      if (selectedWalkerIds.includes(id)) {
        onChange(selectedWalkerIds.filter((wid) => wid !== id));
      }
    } else if (password !== null) {
      alert("密碼錯誤！");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="text-stone-600 font-bold flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-orange-500" />
          柴神領路者
          <span className="text-xs font-normal text-stone-400 bg-stone-100 px-2 py-1 rounded-full">可複選</span>
        </label>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm font-medium text-stone-400 underline decoration-stone-300 hover:text-orange-500 transition-colors p-2"
        >
          {isEditing ? '完成編輯' : '編輯成員'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {walkers.map((walker) => {
          const isSelected = selectedWalkerIds.includes(walker.id);
          return (
            <div
              key={walker.id}
              onClick={() => !isEditing && toggleSelection(walker.id)}
              className={`
                relative px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-200 cursor-pointer border-2 select-none shadow-sm
                ${
                  isSelected && !isEditing
                    ? 'bg-orange-500 text-white border-orange-600 shadow-orange-200 shadow-lg transform -translate-y-1'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:bg-orange-50'
                }
                ${isEditing ? 'pr-10 bg-stone-50 border-dashed' : ''}
              `}
            >
              {walker.name}
              {isEditing && !walker.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWalker(walker.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-100 text-red-500 rounded-full p-1.5 hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        
        {isEditing && (
           <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-2xl border-2 border-stone-200 border-dashed">
             <input 
                type="text" 
                value={newWalkerName}
                onChange={(e) => setNewWalkerName(e.target.value)}
                placeholder="輸入名字"
                className="px-4 py-2 rounded-xl border border-stone-300 text-base focus:outline-none focus:border-orange-500 w-32 bg-white"
             />
             <button 
                onClick={handleAddWalker}
                disabled={!newWalkerName.trim()}
                className="bg-stone-700 text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-stone-800"
             >
                <Plus className="w-5 h-5" />
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default WalkerSelector;