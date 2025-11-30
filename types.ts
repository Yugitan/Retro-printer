export interface Message {
  id: string;
  content: string;
  timestamp: string;
  // Frontend specific state
  x?: number;
  y?: number;
  isPinned?: boolean;
}

export interface MessageRequest {
  content: string;
  // Optional positioning coordinates for message creation
  x?: number;
  y?: number;
}