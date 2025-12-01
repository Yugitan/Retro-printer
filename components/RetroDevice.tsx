import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Trash2, Star, Battery, Signal, Camera } from 'lucide-react';
import { MessageRequest } from '../types';

interface RetroDeviceProps {
  onPrint: (request: MessageRequest) => Promise<void>;
  isPrinting: boolean;
}

export const RetroDevice: React.FC<RetroDeviceProps> = ({ onPrint, isPrinting }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(true); 
  const [hasReminder, setHasReminder] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handlePrint = async () => {
    if (!input.trim() || isPrinting) return;
    
    await onPrint({ 
      type: 'text',
      content: input,
      hasReminder: hasReminder 
    });
    
    setInput('');
    setHasReminder(false);
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isPrinting) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await onPrint({
        type: 'image',
        imageUrl: base64,
        content: 'Photo', // Fallback content
        hasReminder: false
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePrint();
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md mx-auto">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Main Body */}
      <div className="relative bg-[#7DBD43] p-6 rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border-b-8 border-[#5da32b] z-10">
        
        {/* Device Header */}
        <div className="flex justify-between items-center px-4 mb-4 opacity-60 text-xs font-bold tracking-widest text-green-900">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 bg-red-500 rounded-full ${isPrinting ? 'animate-ping' : ''}`}></div>
            <span>AUTO-FEED</span>
            <span className="text-[10px] ml-1">SERIES 9000</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px]">5G</span>
             <Signal size={12} strokeWidth={3} />
             <Battery size={14} fill="currentColor" />
          </div>
        </div>

        {/* Screen Area */}
        <div 
          className="bg-[#1a1c1a] rounded-[1.5rem] p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative overflow-hidden cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center text-[#355e1b] text-[10px] mb-2 font-mono">
             <span className="mr-2">📁 COMPOSE_MODE</span>
             {hasReminder && <span className="text-yellow-400 font-bold animate-pulse mr-2">[REMINDER]</span>}
             <div className="flex-1 h-px bg-[#355e1b] opacity-30"></div>
          </div>

          <div className="relative h-32 w-full font-mono text-xl text-[#4ade80] leading-relaxed">
            <span className="absolute left-0 top-0 text-[#4ade80] opacity-50 select-none">{'>'}</span>
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="absolute inset-0 pl-6 w-full h-full bg-transparent border-none outline-none resize-none text-transparent caret-transparent z-10 placeholder-transparent"
              autoFocus
              disabled={isPrinting}
              spellCheck={false}
            />

            {/* Visual Render Layer */}
            <div className="pl-6 w-full h-full whitespace-pre-wrap break-words pointer-events-none">
              {input}
              {!isPrinting && isFocused && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-[0.6em] h-[1em] bg-[#4ade80] align-text-bottom ml-0.5"
                />
              )}
            </div>
            
            {isPrinting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
                <div className="text-center">
                  <span className="animate-pulse text-[#4ade80] block mb-2 font-bold tracking-widest">PRINTING...</span>
                  <div className="w-24 h-1 bg-[#2d521d] mx-auto rounded overflow-hidden">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-full h-full bg-[#4ade80]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between px-2">
          <div className="flex gap-4">
            {/* Reminder Button */}
            <button 
              onClick={() => setHasReminder(!hasReminder)}
              className={`w-12 h-12 rounded-full shadow-[inset_0_-2px_4px_rgba(255,255,255,0.1),0_4px_4px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all active:translate-y-0.5 ${
                hasReminder 
                  ? 'bg-[#3a3d3a] text-yellow-400 ring-2 ring-yellow-400/30' 
                  : 'bg-[#2a2d2a] text-gray-500 hover:text-[#4ade80]'
              }`}
              title="Toggle Reminder"
            >
              <Star size={20} fill={hasReminder ? "currentColor" : "none"} />
            </button>
            
            {/* Camera Button */}
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isPrinting}
               className="w-12 h-12 rounded-full bg-[#2a2d2a] shadow-[inset_0_-2px_4px_rgba(255,255,255,0.1),0_4px_4px_rgba(0,0,0,0.3)] flex items-center justify-center text-gray-500 hover:text-blue-400 transition-colors active:translate-y-0.5"
               title="Upload Photo"
             >
              <Camera size={20} />
            </button>

             <button 
               onClick={() => { setInput(''); inputRef.current?.focus(); }}
               className="w-12 h-12 rounded-full bg-[#2a2d2a] shadow-[inset_0_-2px_4px_rgba(255,255,255,0.1),0_4px_4px_rgba(0,0,0,0.3)] flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors active:translate-y-0.5"
               title="Clear"
             >
              <Trash2 size={20} />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={handlePrint}
            disabled={isPrinting}
            className={`
              h-14 px-8 rounded-2xl flex items-center gap-3 font-bold text-lg tracking-wider shadow-[0_4px_0_#c2410c,0_8px_10px_rgba(0,0,0,0.3)] transition-all
              ${isPrinting ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none translate-y-1' : 'bg-[#FF6B35] text-[#3f1606] hover:bg-[#ff8555]'}
            `}
          >
            PRINT
            <Printer size={20} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1c1a] text-gray-500 text-[10px] font-bold px-3 py-1 rounded-md tracking-[0.2em] shadow-md">
          MOTOROLA
        </div>
      </div>
    </div>
  );
};