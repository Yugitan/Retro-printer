import { Message, MessageRequest } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/messages';
const LOCAL_STORAGE_KEY = 'retro_printer_messages_v1';

const USE_MOCK_MODE = true; 

const initialMockMessages: Message[] = [
  {
    id: '8658',
    type: 'text',
    content: '你好！| Hello World',
    timestamp: new Date().toISOString(),
    x: 360,
    y: -50
  },
  {
    id: '7052',
    type: 'text',
    content: '我们常常对一些生活小事斤斤计较，却对那些大事毫不在心。',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    x: 360,
    y: 80,
    hasReminder: true
  }
];

const getMockData = (): Message[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockMessages));
  return initialMockMessages;
};

const saveMockData = (msgs: Message[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(msgs));
};

const generateId = () => Math.floor(1000 + Math.random() * 9000).toString();

export const fetchMessages = async (): Promise<Message[]> => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockData();
  }
  const response = await fetch(API_BASE_URL);
  return response.json();
};

export const createMessage = async (request: MessageRequest): Promise<Message> => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    const newMessage: Message = {
      id: generateId(),
      type: request.type,
      content: request.content,
      imageUrl: request.imageUrl,
      timestamp: new Date().toISOString(),
      x: request.x ?? 0, 
      y: request.y ?? -60,
      hasReminder: request.hasReminder
    };
    const current = getMockData();
    const updated = [newMessage, ...current];
    saveMockData(updated);
    return newMessage;
  }
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
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

export const toggleMessageReminder = async (id: string, hasReminder: boolean): Promise<void> => {
  if (USE_MOCK_MODE) {
    const current = getMockData();
    const updated = current.map(m => m.id === id ? { ...m, hasReminder } : m);
    saveMockData(updated);
    return;
  }
  await fetch(`${API_BASE_URL}/${id}/reminder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hasReminder }),
  });
};