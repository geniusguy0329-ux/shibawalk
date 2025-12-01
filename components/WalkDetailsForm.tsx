import React from 'react';
import { WalkFormData, PoopCondition } from '../types';
import { MOOD_OPTIONS } from '../constants';
import { Smile, StickyNote, AlertCircle } from 'lucide-react';

interface Props {
  data: WalkFormData;
  onChange: (data: WalkFormData) => void;
}

const WalkDetailsForm: React.FC<Props> = ({ data, onChange }) => {
  const updateField = (field: keyof WalkFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
      
      {/* Mood */}
      <div>
        <label className="text-stone-700 font-black mb-4 block flex items-center gap-2 text-xl">
          <Smile className="w-6 h-6 text-orange-500" />
          柴神心情
        </label>
        <div className="flex flex-wrap gap-3">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => updateField('mood', mood)}
              className={`
                px-4 py-3 rounded-2xl text-lg font-bold border-2 transition-all shadow-sm
                ${
                  data.mood === mood
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-yellow-100 transform -translate-y-1'
                    : 'bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100 hover:border-stone-200'
                }
              `}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Poop */}
      <div>
        <label className="text-stone-700 font-black mb-4 block flex items-center gap-2 text-xl">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          黃金產出
        </label>
        <div className="flex gap-4 mb-4">
           <label className="flex-1 bg-stone-50 rounded-2xl p-4 border-2 border-stone-100 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 transition-colors cursor-pointer flex items-center gap-3">
             <input 
                type="radio" 
                checked={data.hasPooped === true} 
                onChange={() => updateField('hasPooped', true)}
                className="accent-orange-500 w-6 h-6"
             />
             <span className="text-lg font-bold text-stone-700">有產出</span>
           </label>
           <label className="flex-1 bg-stone-50 rounded-2xl p-4 border-2 border-stone-100 has-[:checked]:border-stone-500 has-[:checked]:bg-stone-100 transition-colors cursor-pointer flex items-center gap-3">
             <input 
                type="radio" 
                checked={data.hasPooped === false} 
                onChange={() => updateField('hasPooped', false)}
                className="accent-stone-500 w-6 h-6"
             />
             <span className="text-lg font-bold text-stone-700">沒有</span>
           </label>
        </div>

        {data.hasPooped && (
          <div className="grid grid-cols-3 gap-3 mt-2 animate-fadeIn">
            {Object.values(PoopCondition).map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => updateField('poopCondition', condition)}
                className={`
                  py-3 text-lg font-bold rounded-xl border-2 text-center transition-all
                  ${
                    data.poopCondition === condition
                      ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-orange-300'
                  }
                `}
              >
                {condition}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-stone-700 font-black mb-4 block flex items-center gap-2 text-xl">
          <StickyNote className="w-6 h-6 text-orange-500" />
          散步心得
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="遇到了什麼朋友？柴神今天走了哪條特別的路？..."
          className="w-full p-4 rounded-2xl bg-stone-50 border-2 border-transparent text-stone-700 text-lg focus:outline-none focus:bg-white focus:border-orange-200 transition-colors h-32 resize-none"
        />
      </div>
    </div>
  );
};

export default WalkDetailsForm;