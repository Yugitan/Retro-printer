import React, { useMemo, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Message } from '../types';
import { Trash2, Pin, Bell, Star, Check, X, Palette } from 'lucide-react';

interface ReceiptCardProps {
  message: Message;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onReminderToggle: (id: string, currentStatus: boolean) => void;
  onStyleUpdate: (id: string, styleId?: string, noteColorId?: string) => void;
  zIndex: number;
  bringToFront: () => void;
}

// Data duplicated from App.tsx to keep component self-contained
const polaroidOptions = [
  { id: 'classic', color: '#ffffff', label: 'Classic' },
  { id: 'orange', color: '#fb923c', label: 'Orange' },
  { id: 'dark', color: '#18181b', label: 'Dark' },
  { id: 'rose', color: '#fda4af', label: 'Rose' },
  { id: 'mint', color: '#6ee7b7', label: 'Mint' },
];

const noteColorOptions = [
  { id: 'white', color: '#ffffff', label: 'White' },
  { id: 'yellow', color: '#fef3c7', label: 'Yellow' }, 
  { id: 'blue', color: '#dbeafe', label: 'Blue' },   
  { id: 'green', color: '#dcfce7', label: 'Green' }, 
  { id: 'pink', color: '#fce7f3', label: 'Pink' },   
  { id: 'purple', color: '#f3e8ff', label: 'Purple' }, 
];

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ 
  message, 
  onDelete, 
  onPin,
  onPositionChange,
  onReminderToggle,
  onStyleUpdate,
  zIndex,
  bringToFront
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDragEnd = (_: any, info: PanInfo) => {
    const newX = message.x + info.offset.x;
    const newY = message.y + info.offset.y;
    onPositionChange(message.id, newX, newY);
  };

  const isNew = useMemo(() => {
    const now = Date.now();
    const msgTime = new Date(message.timestamp).getTime();
    return (now - msgTime) < 5000; 
  }, [message.timestamp]);

  const variants = {
    initial: isNew ? { 
      x: message.x, 
      y: message.y,
      translateX: "-50%",
      translateY: "-50%",
      opacity: 0, 
      scale: 0.9, 
    } : { 
      x: message.x, 
      y: message.y, 
      translateX: "-50%",
      translateY: "-50%",
      opacity: 1, 
      scale: 1 
    },
    animate: { 
      x: message.x, 
      y: message.y, 
      translateX: "-50%",
      translateY: "-50%",
      opacity: 1, 
      scale: 1 
    }
  };

  // Helper to get style classes based on styleId (Polaroid)
  const getPolaroidClasses = (styleId: string | undefined) => {
    switch (styleId) {
      case 'orange': return 'bg-[#fb923c] p-2';
      case 'dark': return 'bg-[#18181b] p-3 border border-gray-700';
      case 'rose': return 'bg-[#fda4af] p-3';
      case 'mint': return 'bg-[#6ee7b7] p-3';
      default: return 'bg-white p-3'; // Classic
    }
  };

  // Helper to get text color based on background lightness
  const getPolaroidTextColor = (styleId: string | undefined) => {
    switch (styleId) {
      case 'dark': return 'text-gray-400';
      default: return 'text-gray-600 font-medium'; // Darker text for light backgrounds
    }
  };

  // Helper to get style classes based on noteColorId (Text Note)
  const getNoteClasses = (colorId: string | undefined) => {
    switch (colorId) {
      case 'yellow': return 'bg-[#fef3c7] hover:bg-[#fff7ed]'; // amber-100
      case 'blue': return 'bg-[#dbeafe] hover:bg-[#eff6ff]';   // blue-100
      case 'green': return 'bg-[#dcfce7] hover:bg-[#f0fdf4]';  // green-100
      case 'pink': return 'bg-[#fce7f3] hover:bg-[#fdf2f8]';   // pink-100
      case 'purple': return 'bg-[#f3e8ff] hover:bg-[#faf5ff]'; // purple-100
      default: return 'bg-[#fdfdfd] hover:bg-white'; // White
    }
  };

  // Helper for footer text color on notes
  const getNoteFooterColor = (colorId: string | undefined) => {
    // If the background is colored, make the footer text darker/sharper
    if (colorId && colorId !== 'white') {
        return 'text-gray-500 font-semibold';
    }
    return 'text-gray-300';
  };

  // ---------------------------------------------------------------------------
  // UI: COLOR PICKER POPOVER
  // ---------------------------------------------------------------------------
  const renderStylePicker = () => {
    if (!showStylePicker) return null;

    return (
      <div 
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-white/95 backdrop-blur rounded-full shadow-xl border border-gray-200 z-[70] flex gap-1 animate-in slide-in-from-bottom-2 fade-in duration-200"
        onPointerDown={(e) => e.stopPropagation()} 
      >
        {message.type === 'image' 
          ? polaroidOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onStyleUpdate(message.id, opt.id, undefined);
                  setShowStylePicker(false);
                }}
                className={`w-5 h-5 rounded border shadow-sm transition-transform hover:scale-125 ${message.styleId === opt.id ? 'ring-2 ring-blue-500 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: opt.color, borderColor: opt.id === 'classic' ? '#e5e7eb' : opt.color }}
                title={opt.label}
              />
            ))
          : noteColorOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onStyleUpdate(message.id, undefined, opt.id);
                  setShowStylePicker(false);
                }}
                className={`w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-125 ${message.noteColorId === opt.id ? 'ring-2 ring-blue-500 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: opt.color }}
                title={opt.label}
              />
          ))
        }
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // SHARED: DELETION UI
  // ---------------------------------------------------------------------------
  const renderDeleteButton = () => (
    <div className="relative flex flex-col items-center">
        <button 
          onClick={(e) => { 
              e.stopPropagation(); 
              setShowDeleteConfirm(!showDeleteConfirm); 
              setShowStylePicker(false); // Close style picker if open
          }}
          className={`p-1.5 rounded-full text-white shadow-sm transition-transform hover:scale-110 ${showDeleteConfirm ? 'bg-red-600' : 'bg-red-400 hover:bg-red-500'}`}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
        {showDeleteConfirm && (
            <div className="absolute top-full mt-2 flex gap-1 bg-white p-1 rounded-full shadow-lg border border-gray-100 z-[70] animate-in slide-in-from-top-1 fade-in duration-200">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(message.id); }}
                    className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                >
                    <Check size={12} strokeWidth={3} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                    className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200"
                >
                    <X size={12} strokeWidth={3} />
                </button>
            </div>
        )}
    </div>
  );


  // ---------------------------------------------------------------------------
  // RENDER: POLAROID PHOTO (Image Type)
  // ---------------------------------------------------------------------------
  if (message.type === 'image') {
    return (
      <motion.div
        drag={!message.isPinned}
        dragMomentum={false}
        initial="initial"
        animate="animate"
        variants={variants}
        style={{ zIndex }}
        transition={isNew ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }}
        whileDrag={{ scale: 1.05, rotate: 1, cursor: 'grabbing', zIndex: 100 }}
        onPointerDown={bringToFront}
        onDragEnd={handleDragEnd}
        // Apply Style Classes dynamically
        className={`absolute top-1/2 left-1/2 cursor-grab shadow-xl pb-8 w-64 transform-gpu group ${getPolaroidClasses(message.styleId)} ${message.isPinned ? 'cursor-default' : ''}`}
      >
         {renderStylePicker()}

         {/* The Photo Image */}
         <div className="w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-2 relative">
            <img 
              src={message.imageUrl} 
              alt="Instant Photo" 
              className="w-full h-full object-cover select-none pointer-events-none" 
            />
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none"></div>

            {/* Favorite Star Overlay */}
            {message.hasReminder && (
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute top-2 right-2 drop-shadow-md"
              >
                <Star size={24} className="text-yellow-400 fill-yellow-400" strokeWidth={1} />
                <Star size={10} className="text-white fill-white absolute top-2 left-2 opacity-80" />
              </motion.div>
            )}
         </div>

         {/* Timestamp */}
         <div className={`text-center font-mono text-[10px] ${getPolaroidTextColor(message.styleId)}`}>
            {date.toLocaleDateString()} • {timeString}
         </div>

         {/* Hover Actions for Polaroid */}
         <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 items-start">
             {/* EDIT STYLE BUTTON */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowStylePicker(!showStylePicker);
                 setShowDeleteConfirm(false);
               }}
               className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${showStylePicker ? 'bg-indigo-500' : 'bg-gray-400 hover:bg-indigo-400'}`}
               title="Change Style"
             >
               <Palette size={12} />
             </button>

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onReminderToggle(message.id, !!message.hasReminder); 
              }}
              className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${
                message.hasReminder ? 'bg-yellow-400 ring-2 ring-white' : 'bg-gray-400 hover:bg-yellow-400'
              }`}
              title="Favorite"
            >
              <Star size={12} fill="currentColor" />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onPin(message.id); }}
              className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-all ${message.isPinned ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-400'}`}
              title="Pin"
            >
              <Pin size={12} fill={message.isPinned ? "currentColor" : "none"} />
            </button>
            
            {renderDeleteButton()}
         </div>
      </motion.div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: RECEIPT NOTE (Text Type)
  // ---------------------------------------------------------------------------
  return (
    <motion.div
      drag={!message.isPinned}
      dragMomentum={false}
      initial="initial"
      animate="animate"
      variants={variants}
      style={{ zIndex }}
      transition={isNew ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }}
      whileDrag={{ scale: 1.05, rotate: 1, cursor: 'grabbing', zIndex: 100 }}
      onPointerDown={bringToFront}
      onDragEnd={handleDragEnd}
      className={`absolute top-1/2 left-1/2 cursor-grab shadow-lg w-72 transform-gpu ${message.isPinned ? 'cursor-default' : ''}`}
    >
      <div className={`relative p-5 pb-8 font-mono text-sm leading-relaxed transition-colors group ${getNoteClasses(message.noteColorId)}`}>
        {renderStylePicker()}

        {/* Header */}
        <div className={`flex justify-between text-xs mb-2 border-b pb-1 transition-colors duration-300 ${
            message.hasReminder 
              ? 'text-red-500 border-red-300 font-bold' 
              : 'text-gray-500 border-gray-200' 
          }`}>
          <span className="flex items-center gap-1">
            {message.hasReminder && <Bell size={10} fill="currentColor"/>}
            {message.hasReminder ? 'REMINDER' : 'MESSAGE'}
          </span>
          <span className={message.hasReminder ? 'text-red-500' : 'text-gray-600'}>{timeString}</span>
        </div>

        {/* Content */}
        <div className="min-h-[3rem] text-base font-bold text-gray-900 break-words whitespace-pre-wrap">
          {message.content} <span className="animate-pulse text-green-500">|</span>
        </div>

        {/* Footer */}
        <div className={`mt-6 flex justify-between items-center text-[10px] uppercase tracking-widest ${getNoteFooterColor(message.noteColorId)}`}>
          <span>SERIES-9000</span>
          <span>ID: #{message.id}</span>
        </div>

        {/* Jagged Bottom Edge */}
        <div 
          className="absolute bottom-0 left-0 w-full h-3 bg-repeat-x opacity-90"
          style={{
            backgroundImage: `radial-gradient(circle, transparent 50%, ${message.noteColorId === 'yellow' ? '#fef3c7' : message.noteColorId === 'blue' ? '#dbeafe' : message.noteColorId === 'green' ? '#dcfce7' : message.noteColorId === 'pink' ? '#fce7f3' : message.noteColorId === 'purple' ? '#f3e8ff' : '#fdfdfd'} 50%)`,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 100%',
            transform: 'rotate(180deg) translateY(50%)'
          }}
        ></div>

        {/* Hover Actions */}
        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 items-start">
          {/* EDIT STYLE BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStylePicker(!showStylePicker);
              setShowDeleteConfirm(false);
            }}
            className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${showStylePicker ? 'bg-indigo-500' : 'bg-gray-400 hover:bg-indigo-400'}`}
            title="Change Color"
          >
            <Palette size={12} />
          </button>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onReminderToggle(message.id, !!message.hasReminder); 
            }}
            className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${
              message.hasReminder ? 'bg-yellow-400 ring-2 ring-red-400' : 'bg-gray-400 hover:bg-yellow-400'
            }`}
            title="Toggle Reminder"
          >
            <Bell size={12} fill="currentColor" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPin(message.id); }}
            className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-all ${message.isPinned ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-400'}`}
          >
            <Pin size={12} fill={message.isPinned ? "currentColor" : "none"} />
          </button>
          
          {renderDeleteButton()}
        </div>
      </div>
    </motion.div>
  );
};