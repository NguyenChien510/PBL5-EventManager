import { apiClient } from "@/utils/axios";

export interface CreateCommentPayload {
  eventId: number;
  content: string;
  rating: number;
  images: string[];
}

export class CommentService {
  static async getMyComments() {
    const response = await apiClient.get('/comments/my');
    return response.data;
  }

  static async createComment(payload: CreateCommentPayload) {
    const response = await apiClient.post('/comments', payload);
    return response.data;
  }
}
