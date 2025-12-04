import { Message, MessageRequest, AppSettings } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';
const MESSAGES_KEY = 'retro_printer_messages_v1';
const SETTINGS_KEY = 'retro_printer_settings_v1';

// Set this to false to use the real Spring Boot backend
const USE_MOCK_MODE = false; 

const initialMockMessages: Message[] = [
  {
    id: '8658',
    type: 'text',
    content: '你好！| Hello World',
    timestamp: new Date().toISOString(),
    x: 0,
    y: -50,
    noteColorId: 'white'
  },
  {
    id: '7052',
    type: 'text',
    content: '我们常常对一些生活小事斤斤计较，却对那些大事毫不在心。',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    x: 0,
    y: 80,
    hasReminder: true,
    noteColorId: 'yellow'
  }
];

const defaultSettings: AppSettings = {
  themeId: 'default',
  polaroidStyle: 'classic',
  noteColorId: 'white',
  printerStyle: 'classic'
};

// --- Helpers ---
const getMockData = (): Message[] => {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Corrupted message data, resetting to defaults.");
    localStorage.removeItem(MESSAGES_KEY);
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(initialMockMessages));
  return initialMockMessages;
};

const saveMockData = (msgs: Message[]) => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error("Failed to save messages to local storage", e);
  }
};

const generateId = () => Math.floor(1000 + Math.random() * 9000).toString();

// --- Messages API ---

export const fetchMessages = async (): Promise<Message[]> => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockData();
  }
  try {
    const response = await fetch(`${API_BASE_URL}/messages`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (e) {
    console.warn("Backend unavailable, falling back to mock", e);
    return getMockData();
  }
};

export const createMessage = async (request: MessageRequest): Promise<Message> => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    const newMessage: Message = {
      id: generateId(),
      type: request.type,
      content: request.content,
      imageUrl: request.imageUrl,
      styleId: request.styleId,
      noteColorId: request.noteColorId,
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
  const response = await fetch(`${API_BASE_URL}/messages`, {
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
  await fetch(`${API_BASE_URL}/messages/${id}`, { method: 'DELETE' });
};

export const updateMessagePosition = async (id: string, x: number, y: number): Promise<void> => {
  if (USE_MOCK_MODE) {
    const current = getMockData();
    const updated = current.map(m => m.id === id ? { ...m, x, y } : m);
    saveMockData(updated);
    return;
  }
  await fetch(`${API_BASE_URL}/messages/${id}/position`, {
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
  await fetch(`${API_BASE_URL}/messages/${id}/reminder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hasReminder }),
  });
};

export const updateMessageStyle = async (id: string, styleId?: string, noteColorId?: string): Promise<void> => {
  if (USE_MOCK_MODE) {
    const current = getMockData();
    const updated = current.map(m => m.id === id ? { ...m, styleId: styleId || m.styleId, noteColorId: noteColorId || m.noteColorId } : m);
    saveMockData(updated);
    return;
  }
  await fetch(`${API_BASE_URL}/messages/${id}/style`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ styleId, noteColorId }),
  });
};

// --- Settings API ---

export const fetchSettings = async (): Promise<AppSettings> => {
  if (USE_MOCK_MODE) {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultSettings, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Corrupted settings data, resetting.");
      localStorage.removeItem(SETTINGS_KEY);
    }
    return defaultSettings;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (response.status === 404) return defaultSettings;
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  } catch (e) {
    console.warn("Backend settings not available, using default", e);
    return defaultSettings;
  }
};

export const updateSettings = async (settings: AppSettings): Promise<void> => {
  if (USE_MOCK_MODE) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return;
  }
  await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
};