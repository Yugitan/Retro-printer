import React, { useEffect, useState } from 'react';
import { RetroDevice } from './components/RetroDevice';
import { ReceiptCard } from './components/ReceiptCard';
import { fetchMessages, createMessage, deleteMessage, updateMessagePosition } from './services/api';
import { Message, MessageRequest } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [topZIndex, setTopZIndex] = useState(30);
  const [messageZIndices, setMessageZIndices] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Initial Fetch
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchMessages();
      // Ensure we use the backend coordinates if available
      const positionedData = data.map((msg) => ({
        ...msg,
        // Fallback random positions if x/y are missing
        x: msg.x ?? (Math.random() * 500 - 250),
        y: msg.y ?? (Math.random() * 200 - 100),
      }));
      setMessages(positionedData);
    } catch (err) {
      console.error(err);
      setError("Could not load message history.");
    }
  };

  const handlePrint = async (request: MessageRequest) => {
    setIsPrinting(true);
    setError(null);
    try {
      // Target position: To the right of the device.
      // Slot is at ~230. We want it to end up further right, e.g., 340-380.
      const targetX = 360; 
      // Add slight random Y variance so they don't stack perfectly on top of each other
      const targetY = (Math.random() * 100) - 50;

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
    if (window.confirm("Shred this message?")) {
      try {
        await deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
      } catch (e) {
        setError("Failed to delete message");
      }
    }
  };

  const handlePin = (id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, isPinned: !m.isPinned } : m
    ));
  };

  const handlePositionChange = async (id: string, x: number, y: number) => {
    // 1. Update UI immediately (Optimistic)
    setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, x, y } : m
    ));

    // 2. Sync to Backend / Local Storage
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Background Hint */}
      <div className="absolute top-4 left-4 text-gray-400 font-mono text-xs opacity-50 select-none">
        <p>SYSTEM: ONLINE</p>
        <p>MODE: REACT_V18</p>
        <p>BACKEND: {true ? "MOCK" : "SPRING_BOOT"}</p>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center">
        
        {/* The Device */}
        <RetroDevice onPrint={handlePrint} isPrinting={isPrinting} />

        {/* Scattered Receipts Area */}
        {/* pointer-events-none ensures clicks pass through empty space to the device */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {messages.map((msg) => (
            <div key={msg.id} className="contents pointer-events-auto">
              <ReceiptCard 
                message={msg} 
                onDelete={handleDelete}
                onPin={handlePin}
                onPositionChange={handlePositionChange}
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

      <div className="fixed bottom-4 right-4 text-gray-400 text-xs font-mono select-none">
        DRAG NOTES TO MOVE | HOVER FOR ACTIONS | AUTO-SAVE ENABLED
      </div>
    </div>
  );
};

export default App;