import { CHATBOT_API_URL } from "@/constants";

export interface ChatbotMessage {
  role: "user" | "ai";
  content: string;
  timestamp?: string;
}

export interface ChatbotRequest {
  message: string;
  session_id: string;
  token?: string | null;
  user_id?: string | number;
}

const buildChatbotUrl = (path: string) =>
  `${CHATBOT_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

const chatbotJsonFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildChatbotUrl(path), init);

  if (!response.ok) {
    throw new Error(`Chatbot API request failed: ${response.status}`);
  }

  return response.json();
};

export class ChatbotService {
  static async getHistory(userId: string | number) {
    return chatbotJsonFetch<{ history?: ChatbotMessage[] }>(`/chat-history/${userId}`);
  }

  static async clearHistory(userId: string | number) {
    const response = await fetch(buildChatbotUrl(`/chat-history/${userId}`), {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Chatbot API request failed: ${response.status}`);
    }
  }

  static streamChat(payload: ChatbotRequest) {
    return fetch(buildChatbotUrl("/chat/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  static async chat(payload: ChatbotRequest) {
    return chatbotJsonFetch<{ answer?: string }>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
}
