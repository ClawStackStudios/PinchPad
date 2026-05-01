import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InteractiveBrandProps {
  className?: string;
  onClick?: () => void;
  showCopyright?: boolean;
  showIcon?: boolean;
  iconClassName?: string;
  variant?: 'subtle' | 'prominent';
}

export function InteractiveBrand({ 
  className, 
  onClick, 
  showCopyright = true, 
  showIcon = false,
  iconClassName,
  variant = 'subtle'
}: InteractiveBrandProps) {
  const pinch = "Pinch".split("");
  const pad = "Pad".split("");

  const isProminent = variant === 'prominent';

  const letterVariants = {
    initial: { y: 0 },
    hover: { 
      y: isProminent ? -12 : -3, 
      scale: isProminent ? 1.15 : 1.05,
      transition: { 
        type: 'spring', 
        stiffness: isProminent ? 400 : 400, 
        damping: isProminent ? 12 : 30 
      } 
    }
  };

  return (
    <div 
      className={cn("inline-flex items-center gap-3 cursor-pointer select-none", className)}
      onClick={onClick}
    >
      {showIcon && (
        <motion.div 
          className={cn(
            "w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/20 origin-bottom",
            iconClassName
          )}
          variants={letterVariants}
          initial="initial"
          whileHover="hover"
        >
          <span className="text-2xl select-none">🦞</span>
        </motion.div>
      )}
      <div className="flex items-center">
        <span className="flex">
          {pinch.map((letter, i) => (
            <motion.span
              key={`pinch-${i}`}
              variants={letterVariants}
              initial="initial"
              whileHover="hover"
              className="text-amber-500 inline-block origin-bottom"
            >
              {letter}
            </motion.span>
          ))}
        </span>
        <span className="flex">
          {pad.map((letter, i) => (
            <motion.span
              key={`pad-${i}`}
              variants={letterVariants}
              initial="initial"
              whileHover="hover"
              className="text-red-600 dark:text-red-500 inline-block origin-bottom"
            >
              {letter}
            </motion.span>
          ))}
        </span>
        {showCopyright && (
          <span className="text-slate-500 text-[0.6em] font-normal ml-0.5 self-end mb-1 tracking-tighter">©™</span>
        )}
      </div>
    </div>
  );
}
