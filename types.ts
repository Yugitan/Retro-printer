export interface Message {
  id: string;
  type: 'text' | 'image';
  content?: string;
  imageUrl?: string;
  styleId?: string; // For Polaroid Style
  noteColorId?: string; // For Receipt/Note Color
  timestamp: string;
  x?: number;
  y?: number;
  isPinned?: boolean;
  hasReminder?: boolean;
}

export interface MessageRequest {
  type: 'text' | 'image';
  content?: string;
  imageUrl?: string;
  styleId?: string;
  noteColorId?: string;
  x?: number;
  y?: number;
  hasReminder?: boolean;
}

export interface AppSettings {
  themeId: string;
  polaroidStyle: string;
  noteColorId: string;
  printerStyle: string;
}