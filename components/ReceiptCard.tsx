import React, { useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Message } from '../types';
import { Trash2, Pin, Bell, Star } from 'lucide-react';

interface ReceiptCardProps {
  message: Message;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onReminderToggle: (id: string, currentStatus: boolean) => void;
  zIndex: number;
  bringToFront: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ 
  message, 
  onDelete, 
  onPin,
  onPositionChange,
  onReminderToggle,
  zIndex,
  bringToFront
}) => {
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDragEnd = (_: any, info: PanInfo) => {
    // We maintain the offset logic. 
    // Because we use translateX/Y: -50% in the variants, the x/y values 
    // represent the center point of the card.
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
        // Polaroid Style: White border, thick bottom padding
        className={`absolute top-1/2 left-1/2 cursor-grab bg-white shadow-xl p-3 pb-8 w-64 transform-gpu group ${message.isPinned ? 'cursor-default' : ''}`}
      >
         {/* The Photo Image */}
         <div className="w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-2 relative">
            <img 
              src={message.imageUrl} 
              alt="Instant Photo" 
              className="w-full h-full object-cover select-none pointer-events-none" 
            />
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none"></div>

            {/* Favorite Star Overlay (Visible if hasReminder is true) */}
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

         {/* Handwritten-style timestamp */}
         <div className="text-center font-mono text-[10px] text-gray-400">
            {date.toLocaleDateString()} • {timeString}
         </div>

         {/* Hover Actions for Polaroid */}
         <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            {/* Favorite Button (Reusing Reminder Toggle Logic for data) */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onReminderToggle(message.id, !!message.hasReminder); 
              }}
              className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${
                message.hasReminder ? 'bg-yellow-400 ring-2 ring-white' : 'bg-gray-300 hover:bg-yellow-400'
              }`}
              title="Favorite"
            >
              <Star size={12} fill="currentColor" />
            </button>

            {/* Pin Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onPin(message.id); }}
              className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-all ${message.isPinned ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-400'}`}
              title="Pin"
            >
              <Pin size={12} fill={message.isPinned ? "currentColor" : "none"} />
            </button>

            {/* Delete Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(message.id); }}
              className="p-1.5 bg-red-400 rounded-full text-white shadow-sm hover:bg-red-500 hover:scale-110 transition-transform"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
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
      className={`absolute top-1/2 left-1/2 cursor-grab bg-white shadow-lg w-72 transform-gpu ${message.isPinned ? 'cursor-default' : ''}`}
    >
      <div className="relative p-5 pb-8 bg-[#fdfdfd] text-gray-800 font-mono text-sm leading-relaxed transition-colors hover:bg-white group">
        
        {/* Header - Conditional Styling for Reminder */}
        <div className={`flex justify-between text-xs mb-2 border-b pb-1 transition-colors duration-300 ${
            message.hasReminder 
              ? 'text-red-500 border-red-300 font-bold' 
              : 'text-gray-400 border-gray-100'
          }`}>
          <span className="flex items-center gap-1">
            {message.hasReminder && <Bell size={10} fill="currentColor"/>}
            {message.hasReminder ? 'REMINDER' : 'MESSAGE'}
          </span>
          <span className={message.hasReminder ? 'text-red-500' : ''}>{timeString}</span>
        </div>

        {/* Content */}
        <div className="min-h-[3rem] text-base font-bold text-gray-900 break-words whitespace-pre-wrap">
          {message.content} <span className="animate-pulse text-green-500">|</span>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center text-[10px] text-gray-300 uppercase tracking-widest">
          <span>SERIES-9000</span>
          <span>ID: #{message.id}</span>
        </div>

        {/* Jagged Bottom Edge */}
        <div 
          className="absolute bottom-0 left-0 w-full h-3 bg-repeat-x"
          style={{
            backgroundImage: 'radial-gradient(circle, transparent 50%, #fdfdfd 50%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 100%',
            transform: 'rotate(180deg) translateY(50%)'
          }}
        ></div>

        {/* Hover Actions */}
        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onReminderToggle(message.id, !!message.hasReminder); 
            }}
            className={`p-1.5 rounded-full text-white shadow-sm hover:scale-110 transition-transform ${
              message.hasReminder ? 'bg-yellow-400 ring-2 ring-red-400' : 'bg-yellow-400 hover:bg-yellow-500'
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
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(message.id); }}
            className="p-1.5 bg-red-400 rounded-full text-white shadow-sm hover:bg-red-500 hover:scale-110 transition-transform"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};