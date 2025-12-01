export interface Message {
  id: string;
  type: 'text' | 'image'; // New field to distinguish content
  content?: string;
  imageUrl?: string; // New field for Base64 image data
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
  x?: number;
  y?: number;
  hasReminder?: boolean;
}