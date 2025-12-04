import React, { useEffect, useState, useRef } from 'react';
import { RetroDevice } from './components/RetroDevice';
import { ReceiptCard } from './components/ReceiptCard';
import { fetchMessages, createMessage, deleteMessage, updateMessagePosition, toggleMessageReminder, fetchSettings, updateSettings, updateMessageStyle } from './services/api';
import { Message, MessageRequest } from './types';
import { Settings, Palette, Check, ChevronRight, Camera, StickyNote, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const themes = [
  { id: 'default', bg: '#f0f2f5', dot: '#cbd5e1' },
  { id: 'warm', bg: '#fffbeb', dot: '#e7e5e4' }, // amber-50
  { id: 'mint', bg: '#f0fdf4', dot: '#bbf7d0' }, // green-50
  { id: 'rose', bg: '#fff1f2', dot: '#fecdd3' }, // rose-50
  { id: 'blue', bg: '#eff6ff', dot: '#bfdbfe' }, // blue-50
  { id: 'dark', bg: '#1c1917', dot: '#44403c' }, // stone-900
];

const polaroidOptions = [
  { id: 'classic', color: '#ffffff', label: 'Classic' },
  { id: 'orange', color: '#fb923c', label: 'Orange' },
  { id: 'dark', color: '#18181b', label: 'Dark' },
  { id: 'rose', color: '#fda4af', label: 'Rose' },
  { id: 'mint', color: '#6ee7b7', label: 'Mint' },
];

const noteColorOptions = [
  { id: 'white', color: '#ffffff', label: 'White' },
  { id: 'yellow', color: '#fef3c7', label: 'Yellow' }, // amber-100
  { id: 'blue', color: '#dbeafe', label: 'Blue' },   // blue-100
  { id: 'green', color: '#dcfce7', label: 'Green' },  // green-100
  { id: 'pink', color: '#fce7f3', label: 'Pink' },   // pink-100
  { id: 'purple', color: '#f3e8ff', label: 'Purple' }, // purple-100
];

const printerOptions = [
  { id: 'classic', color: '#7DBD43', label: '经典绿' },
  { id: 'carbon', color: '#27272a', label: '暗夜黑' },
  { id: 'retro', color: '#e5e5cb', label: '复古米' },
  { id: 'sakura', color: '#f472b6', label: '樱花粉' },
  { id: 'cyber', color: '#0f172a', label: '赛博紫' },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [topZIndex, setTopZIndex] = useState(30);
  const [messageZIndices, setMessageZIndices] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPolaroidPicker, setShowPolaroidPicker] = useState(false);
  const [showNoteColorPicker, setShowNoteColorPicker] = useState(false);
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  
  // Settings Menu Reference for click-outside detection
  const settingsRef = useRef<HTMLDivElement>(null);

  // App Preferences
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [polaroidStyle, setPolaroidStyle] = useState(polaroidOptions[0].id);
  const [noteColor, setNoteColor] = useState(noteColorOptions[0].id);
  const [printerStyle, setPrinterStyle] = useState(printerOptions[0].id);

  // Track if initial load is done to avoid overwriting settings
  const isLoadedRef = useRef(false);

  // Load everything on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Load Messages
        const msgs = await fetchMessages();
        const positionedData = msgs.map((msg) => ({
          ...msg,
          x: msg.x ?? (Math.random() * 500 - 250),
          y: msg.y ?? (Math.random() * 200 - 100),
        }));
        setMessages(positionedData);

        // Load Settings
        const settings = await fetchSettings();
        if (settings) {
            const theme = themes.find(t => t.id === settings.themeId) || themes[0];
            setCurrentTheme(theme);
            setPolaroidStyle(settings.polaroidStyle || polaroidOptions[0].id);
            setNoteColor(settings.noteColorId || noteColorOptions[0].id);
            setPrinterStyle(settings.printerStyle || printerOptions[0].id);
        }

        isLoadedRef.current = true;
      } catch (err) {
        console.error(err);
        setError("Could not load data.");
        isLoadedRef.current = true; // Still mark as loaded to allow saving new settings
      }
    };
    init();
  }, []);

  // Click Outside to Close Settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
        // Reset sub-menus when closing
        setShowColorPicker(false);
        setShowPolaroidPicker(false);
        setShowNoteColorPicker(false);
        setShowPrinterPicker(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Save settings on change
  useEffect(() => {
    if (!isLoadedRef.current) return;

    const save = async () => {
       try {
         await updateSettings({
           themeId: currentTheme.id,
           polaroidStyle,
           noteColorId: noteColor,
           printerStyle
         });
       } catch (e) {
         console.error("Failed to save settings", e);
       }
    };
    save();
  }, [currentTheme, polaroidStyle, noteColor, printerStyle]);

  const handlePrint = async (request: MessageRequest) => {
    setIsPrinting(true);
    setError(null);
    try {
      // Spawn at center screen visual offset (above device center)
      const targetX = 0; 
      const targetY = -60;

      const newMessage = await createMessage({ ...request, x: targetX, y: targetY });
      
      setMessages(prev => [newMessage, ...prev]);
      bringToFront(newMessage.id);
    } catch (err) {
      setError("Printing failed. Check connection.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError("Failed to delete item");
    }
  };

  const handlePin = (id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, isPinned: !m.isPinned } : m
    ));
  };

  const handleReminderToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, hasReminder: newStatus } : m
    ));

    try {
      await toggleMessageReminder(id, newStatus);
    } catch (e) {
      console.error("Failed to toggle reminder", e);
      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, hasReminder: currentStatus } : m
      ));
    }
  };

  const handleStyleUpdate = async (id: string, styleId?: string, noteColorId?: string) => {
    // Optimistic Update
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, styleId: styleId || m.styleId, noteColorId: noteColorId || m.noteColorId } : m
    ));

    try {
      await updateMessageStyle(id, styleId, noteColorId);
    } catch (e) {
      console.error("Failed to update style", e);
      setError("Failed to save color change");
    }
  };

  const handlePositionChange = async (id: string, x: number, y: number) => {
    setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, x, y } : m
    ));

    try {
        await updateMessagePosition(id, x, y);
    } catch (e) {
        console.error("Failed to save position", e);
    }
  };

  const bringToFront = (id: string) => {
    const newZ = topZIndex + 1;
    setTopZIndex(newZ);
    setMessageZIndices(prev => ({ ...prev, [id]: newZ }));
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative transition-colors duration-500"
      style={{
        backgroundColor: currentTheme.bg,
        backgroundImage: `radial-gradient(${currentTheme.dot} 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}
    >
      <div className="absolute top-4 left-4 text-gray-400 font-mono text-xs opacity-50 select-none pointer-events-none">
        <p>SYSTEM: ONLINE</p>
        <p>MODE: REACT_V18</p>
        <p>BACKEND: {true ? "MOCK" : "SPRING_BOOT"}</p>
      </div>

      {/* Settings UI */}
      <div 
        ref={settingsRef}
        className="fixed top-4 right-4 z-[9999] flex flex-col items-end font-sans"
      >
         <button 
           onClick={() => {
             setIsSettingsOpen(!isSettingsOpen);
             if (isSettingsOpen) {
               setShowColorPicker(false);
               setShowPolaroidPicker(false);
               setShowNoteColorPicker(false);
               setShowPrinterPicker(false);
             }
           }}
           className="bg-white/80 backdrop-blur shadow-sm border border-gray-200 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white transition-all font-mono text-sm text-gray-600 hover:text-gray-900"
         >
           <Settings size={14} />
           <span>设置</span>
         </button>

         <AnimatePresence>
         {isSettingsOpen && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="mt-2 w-56 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 flex flex-col gap-1"
           >
             
             {/* Printer Style Menu Item */}
             <button
               onClick={() => {
                 setShowPrinterPicker(!showPrinterPicker);
                 setShowColorPicker(false);
                 setShowPolaroidPicker(false);
                 setShowNoteColorPicker(false);
               }}
               className={`flex items-center justify-between w-full px-3 py-2 text-sm font-mono rounded-lg transition-colors ${showPrinterPicker ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <div className="flex items-center gap-2">
                 <Printer size={14} />
                 <span>打印机样式</span>
               </div>
               <ChevronRight size={14} className={`transform transition-transform duration-200 ${showPrinterPicker ? 'rotate-90' : ''}`} />
             </button>

             {/* Printer Style Picker Grid */}
             <AnimatePresence>
             {showPrinterPicker && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="grid grid-cols-5 gap-2 p-2 bg-gray-50/50 rounded-lg mx-1 mb-1 border border-gray-100 overflow-hidden"
               >
                  {printerOptions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPrinterStyle(p.id)}
                      className={`w-full aspect-square rounded-lg border shadow-sm flex items-center justify-center transition-all hover:scale-110 ${printerStyle === p.id ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    >
                      {printerStyle === p.id && (
                        <Check size={12} className="text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
               </motion.div>
             )}
             </AnimatePresence>

             {/* Theme Color Menu Item */}
             <button
               onClick={() => {
                 setShowColorPicker(!showColorPicker);
                 setShowPrinterPicker(false);
                 setShowPolaroidPicker(false);
                 setShowNoteColorPicker(false);
               }}
               className={`flex items-center justify-between w-full px-3 py-2 text-sm font-mono rounded-lg transition-colors ${showColorPicker ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <div className="flex items-center gap-2">
                 <Palette size={14} />
                 <span>背景颜色</span>
               </div>
               <ChevronRight size={14} className={`transform transition-transform duration-200 ${showColorPicker ? 'rotate-90' : ''}`} />
             </button>
             
             {/* Theme Color Picker Grid */}
             <AnimatePresence>
             {showColorPicker && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="grid grid-cols-6 gap-2 p-2 bg-gray-50/50 rounded-lg mx-1 mb-1 border border-gray-100 overflow-hidden"
               >
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setCurrentTheme(t)}
                      className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm flex items-center justify-center transition-all hover:scale-110 ${currentTheme.id === t.id ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : ''}`}
                      style={{ backgroundColor: t.bg }}
                      title={t.id}
                    >
                      {currentTheme.id === t.id && (
                        <Check size={10} className={t.id === 'dark' ? 'text-white' : 'text-gray-600'} />
                      )}
                    </button>
                  ))}
               </motion.div>
             )}
             </AnimatePresence>

             {/* Polaroid Style Menu Item */}
             <button
               onClick={() => {
                 setShowPolaroidPicker(!showPolaroidPicker);
                 setShowPrinterPicker(false);
                 setShowColorPicker(false);
                 setShowNoteColorPicker(false);
               }}
               className={`flex items-center justify-between w-full px-3 py-2 text-sm font-mono rounded-lg transition-colors ${showPolaroidPicker ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <div className="flex items-center gap-2">
                 <Camera size={14} />
                 <span>拍立得样式</span>
               </div>
               <ChevronRight size={14} className={`transform transition-transform duration-200 ${showPolaroidPicker ? 'rotate-90' : ''}`} />
             </button>

             {/* Polaroid Picker Grid */}
             <AnimatePresence>
             {showPolaroidPicker && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="grid grid-cols-5 gap-2 p-2 bg-gray-50/50 rounded-lg mx-1 mb-1 border border-gray-100 overflow-hidden"
               >
                  {polaroidOptions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPolaroidStyle(p.id)}
                      className={`w-full aspect-[3/4] rounded border shadow-sm flex flex-col items-center justify-end pb-1 transition-all hover:scale-110 ${polaroidStyle === p.id ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: p.color, borderColor: p.id === 'classic' ? '#e5e7eb' : p.color }}
                      title={p.label}
                    >
                      <div className="w-[70%] h-[50%] bg-gray-200/50 mb-1"></div>
                    </button>
                  ))}
               </motion.div>
             )}
             </AnimatePresence>

             {/* Note Color Menu Item */}
             <button
               onClick={() => {
                 setShowNoteColorPicker(!showNoteColorPicker);
                 setShowPrinterPicker(false);
                 setShowPolaroidPicker(false);
                 setShowColorPicker(false);
               }}
               className={`flex items-center justify-between w-full px-3 py-2 text-sm font-mono rounded-lg transition-colors ${showNoteColorPicker ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <div className="flex items-center gap-2">
                 <StickyNote size={14} />
                 <span>便签颜色</span>
               </div>
               <ChevronRight size={14} className={`transform transition-transform duration-200 ${showNoteColorPicker ? 'rotate-90' : ''}`} />
             </button>

             {/* Note Color Picker Grid */}
             <AnimatePresence>
             {showNoteColorPicker && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="grid grid-cols-6 gap-2 p-2 bg-gray-50/50 rounded-lg mx-1 mb-1 border border-gray-100 overflow-hidden"
               >
                  {noteColorOptions.map(n => (
                    <button
                      key={n.id}
                      onClick={() => setNoteColor(n.id)}
                      className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm flex items-center justify-center transition-all hover:scale-110 ${noteColor === n.id ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : ''}`}
                      style={{ backgroundColor: n.color }}
                      title={n.label}
                    >
                      {noteColor === n.id && (
                        <Check size={10} className="text-gray-600" />
                      )}
                    </button>
                  ))}
               </motion.div>
             )}
             </AnimatePresence>

           </motion.div>
         )}
         </AnimatePresence>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center">
        
        {/* The Device */}
        <RetroDevice 
          onPrint={handlePrint} 
          isPrinting={isPrinting} 
          polaroidStyle={polaroidStyle}
          noteColor={noteColor}
          printerStyle={printerStyle} 
        />

        {/* Scattered Receipts Area */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {messages.map((msg) => (
            <div key={msg.id} className="contents pointer-events-auto">
              <ReceiptCard 
                message={msg} 
                onDelete={handleDelete}
                onPin={handlePin}
                onPositionChange={handlePositionChange}
                onReminderToggle={handleReminderToggle}
                onStyleUpdate={handleStyleUpdate}
                zIndex={messageZIndices[msg.id] || 30}
                bringToFront={() => bringToFront(msg.id)}
              />
            </div>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="fixed bottom-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg font-mono text-sm animate-bounce">
          ERROR: {error}
        </div>
      )}

      <div className="fixed bottom-4 right-4 text-gray-400 text-xs font-mono select-none pointer-events-none">
        DRAG NOTES TO MOVE | HOVER FOR ACTIONS | AUTO-SAVE ENABLED
      </div>
    </div>
  );
};

export default App;