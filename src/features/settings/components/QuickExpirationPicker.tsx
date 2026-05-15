import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface QuickExpirationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const QUICK_OPTIONS = [
  { label: 'Minutes', unit: 'minutes', values: [5, 15, 30, 45, 60] },
  { label: 'Hours', unit: 'hours', values: [1, 2, 4, 8, 12, 24] },
  { label: 'Days', unit: 'days', values: [1, 2, 3, 5, 7] },
  { label: 'Months', unit: 'months', values: [1, 3, 6, 12] },
];

export function QuickExpirationPicker({ value, onChange }: QuickExpirationPickerProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const selectedDate = value ? new Date(value) : null;
  const now = new Date();
  const isFarFuture = selectedDate ? (selectedDate.getTime() - now.getTime() > 24 * 60 * 60 * 1000) : false;
  
  const hours = selectedDate ? selectedDate.getHours() : 0;
  const minutes = selectedDate ? selectedDate.getMinutes() : 0;
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;

  const handleQuickSelect = (amount: number, unit: string) => {
    const date = new Date();
    if (unit === 'minutes') date.setMinutes(date.getMinutes() + amount);
    if (unit === 'hours') date.setHours(date.getHours() + amount);
    if (unit === 'days') date.setDate(date.getDate() + amount);
    if (unit === 'months') date.setMonth(date.getMonth() + amount);
    
    const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    onChange(localISO);
  };

  return (
    <div className="space-y-4">
      {/* Visual Aids Container */}
      <div className="flex items-center justify-center gap-8 py-4 h-40">
        {/* Clock Visual */}
        <motion.div 
          className="relative w-32 h-32 rounded-full border-4 border-amber-500/20 dark:border-amber-500/10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 shadow-inner"
          animate={{ opacity: value ? 1 : 0.5, scale: value ? 1 : 0.95 }}
        >
           {/* Hour Hand */}
           <motion.div 
             className="absolute w-1.5 h-8 bg-amber-600 rounded-full origin-bottom shadow-sm"
             animate={{ rotate: selectedDate ? (hours % 12) * 30 + (minutes / 2) : 0 }}
             transition={{ type: "spring", stiffness: 50 }}
             style={{ bottom: '50%' }}
           />
           {/* Minute Hand */}
           <motion.div 
             className="absolute w-1 h-12 bg-amber-500 rounded-full origin-bottom shadow-sm"
             animate={{ rotate: selectedDate ? minutes * 6 : 0 }}
             transition={{ type: "spring", stiffness: 50 }}
             style={{ bottom: '50%' }}
           />
           <div className="w-3 h-3 bg-amber-700 rounded-full z-10 shadow-md" />
           
           {/* Hour Markers */}
           {[...Array(12)].map((_, i) => (
             <div 
               key={i} 
               className="absolute w-0.5 h-1.5 bg-slate-300 dark:bg-slate-700" 
               style={{ 
                 transform: `rotate(${i * 30}deg) translateY(-54px)`,
               }}
             />
           ))}

           {/* AM/PM Indicator */}
           <AnimatePresence>
             {value && !isFarFuture && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="absolute bottom-6 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter"
               >
                 {isPM ? 'PM' : 'AM'}
               </motion.div>
             )}
           </AnimatePresence>
        </motion.div>

        {/* Calendar Tile (only for long durations) */}
        <AnimatePresence>
          {isFarFuture && (
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -20, rotate: -10 }}
              className="relative w-24 h-28 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="h-8 bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {selectedDate?.toLocaleString('default', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-50 leading-none">
                  {selectedDate?.getDate()}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {selectedDate?.getFullYear()}
                </span>
              </div>
              {/* Ring holes visual */}
              <div className="absolute top-1.5 left-4 w-1.5 h-1.5 bg-slate-900/20 rounded-full" />
              <div className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-slate-900/20 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Quick Share Expiration
        </label>
        
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {QUICK_OPTIONS.map((section) => (
            <div key={section.unit}>
              <button
                onClick={() => setOpenSection(openSection === section.unit ? null : section.unit)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.label}</span>
                </div>
                {openSection === section.unit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {openSection === section.unit && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="p-2 grid grid-cols-3 gap-2">
                      {section.values.map((v) => (
                        <button
                          key={v}
                          onClick={() => handleQuickSelect(v, section.unit)}
                          className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-amber-500 hover:text-amber-600 transition-all"
                        >
                          {v} {section.unit === 'minutes' ? 'min' : section.unit === 'hours' ? 'hr' : section.unit === 'days' ? 'day' : 'mo'}
                          {v > 1 && section.unit !== 'minutes' && 's'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or Manual Entry</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
      </div>
    </div>
  );
}
