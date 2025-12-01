import React, { useEffect, useState } from 'react';
import { RetroDevice } from './components/RetroDevice';
import { ReceiptCard } from './components/ReceiptCard';
import { fetchMessages, createMessage, deleteMessage, updateMessagePosition, toggleMessageReminder } from './services/api';
import { Message, MessageRequest } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [topZIndex, setTopZIndex] = useState(30);
  const [messageZIndices, setMessageZIndices] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchMessages();
      const positionedData = data.map((msg) => ({
        ...msg,
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
    if (window.confirm("Delete this item?")) {
      try {
        await deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
      } catch (e) {
        setError("Failed to delete item");
      }
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute top-4 left-4 text-gray-400 font-mono text-xs opacity-50 select-none">
        <p>SYSTEM: ONLINE</p>
        <p>MODE: REACT_V18</p>
        <p>BACKEND: {true ? "MOCK" : "SPRING_BOOT"}</p>
      </div>

      <div className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center">
        <RetroDevice onPrint={handlePrint} isPrinting={isPrinting} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {messages.map((msg) => (
            <div key={msg.id} className="contents pointer-events-auto">
              <ReceiptCard 
                message={msg} 
                onDelete={handleDelete}
                onPin={handlePin}
                onPositionChange={handlePositionChange}
                onReminderToggle={handleReminderToggle}
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