import { Message, MessageRequest } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/messages';
const LOCAL_STORAGE_KEY = 'retro_printer_messages_v1';

// =========================================================
// INTEGRATION SETTINGS
// Set this to FALSE to connect to the Spring Boot backend.
// =========================================================
const USE_MOCK_MODE = true; 

// Initial Mock Data (Only used if localStorage is empty)
const initialMockMessages: Message[] = [
  {
    id: '8658',
    content: '你好！| Hello World',
    timestamp: new Date().toISOString(),
    x: 360,
    y: -50
  },
  {
    id: '7052',
    content: '我们常常对一些生活小事斤斤计较，却对那些大事毫不在心。',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    x: 360,
    y: 80
  }
];

// Helper to get mock data from LocalStorage
const getMockData = (): Message[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockMessages));
  return initialMockMessages;
};

// Helper to save mock data
const saveMockData = (msgs: Message[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(msgs));
};

const generateId = () => Math.floor(1000 + Math.random() * 9000).toString();

export const fetchMessages = async (): Promise<Message[]> => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockData();
  }

  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const createMessage = async (request: MessageRequest): Promise<Message> => {
  if (USE_MOCK_MODE) {
    // Printing delay simulation
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    
    // Default print start position (will be animated in UI)
    const newMessage: Message = {
      id: generateId(),
      content: request.content,
      timestamp: new Date().toISOString(),
      x: request.x ?? 360, // Default to right side
      y: request.y ?? 0
    };
    
    const current = getMockData();
    const updated = [newMessage, ...current];
    saveMockData(updated);
    
    return newMessage;
  }

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error('Failed to create message');
    return response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const deleteMessage = async (id: string): Promise<void> => {
  if (USE_MOCK_MODE) {
    const current = getMockData();
    const updated = current.filter(m => m.id !== id);
    saveMockData(updated);
    return;
  }
  await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
};

export const updateMessagePosition = async (id: string, x: number, y: number): Promise<void> => {
  if (USE_MOCK_MODE) {
    const current = getMockData();
    const updated = current.map(m => m.id === id ? { ...m, x, y } : m);
    saveMockData(updated);
    return;
  }

  await fetch(`${API_BASE_URL}/${id}/position`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y }),
  });
};