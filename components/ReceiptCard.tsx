import React, { useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Message } from '../types';
import { Trash2, Pin, Bell } from 'lucide-react';

interface ReceiptCardProps {
  message: Message;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  zIndex: number;
  bringToFront: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ 
  message, 
  onDelete, 
  onPin,
  onPositionChange,
  zIndex,
  bringToFront
}) => {
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDragEnd = (_: any, info: PanInfo) => {
    // We simply update the numeric offset. 
    // Since we are anchored at top-1/2 left-1/2, (0,0) is center.
    const newX = message.x + info.offset.x;
    const newY = message.y + info.offset.y;
    onPositionChange(message.id, newX, newY);
  };

  // Determine if this is a "new" message that needs to be printed out
  const isNew = useMemo(() => {
    const now = Date.now();
    const msgTime = new Date(message.timestamp).getTime();
    return (now - msgTime) < 5000; 
  }, [message.timestamp]);

  // Animation Config
  // The device half-width is ~224px. The slot extends ~32px out.
  // Visual center of slot is roughly at x=236.
  const SLOT_X_POSITION = 236;

  const variants = {
    initial: isNew ? { 
      x: SLOT_X_POSITION, // Start exactly at the slot mouth
      y: 0, 
      opacity: 1, 
      scaleX: 0, // Zero width (inside the printer)
      scaleY: 1,
    } : { 
      x: message.x, 
      y: message.y, 
      opacity: 1, 
      scaleX: 1, 
      scaleY: 1 
    },
    animate: { 
      x: message.x, 
      y: message.y, 
      opacity: 1, 
      scaleX: 1, 
      scaleY: 1 
    }
  };

  return (
    <motion.div
      drag={!message.isPinned}
      dragMomentum={false}
      
      initial="initial"
      animate="animate"
      variants={variants}
      
      // Transform Origin LEFT CENTER is crucial.
      // It ensures the paper grows OUTWARDS to the right from the slot.
      style={{ zIndex, transformOrigin: 'left center' }}

      transition={isNew ? { 
        duration: 1.8, 
        ease: [0.2, 0, 0.2, 1], // Custom mechanical ease
      } : { 
        duration: 0 
      }}
      
      whileDrag={{ scale: 1.05, rotate: 1, cursor: 'grabbing', zIndex: 100 }}
      onPointerDown={bringToFront}
      onDragEnd={handleDragEnd}
      
      // Centered anchor point
      className={`absolute top-1/2 left-1/2 cursor-grab bg-white shadow-lg w-72 transform-gpu ${message.isPinned ? 'cursor-default' : ''}`}
    >
      <div className="relative p-5 pb-8 bg-[#fdfdfd] text-gray-800 font-mono text-sm leading-relaxed transition-colors hover:bg-white group">
        {/* Header */}
        <div className="flex justify-between text-xs text-gray-400 mb-2 border-b border-gray-100 pb-1">
          <span>MESSAGE</span>
          <span>{timeString}</span>
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
            onClick={(e) => { e.stopPropagation(); alert(`Reminder set for: ${message.content}`); }}
            className="p-1.5 bg-yellow-400 rounded-full text-white shadow-sm hover:bg-yellow-500 hover:scale-110 transition-transform"
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