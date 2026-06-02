import { apiClient } from "@/utils/axios";

export interface CreatePaymentPayload {
  amount: number;
  orderInfo: string;
  userId?: string | number;
  seatIds: number[];
  paymentMethod: string;
  couponCode?: string | null;
}

export class PaymentService {
  static async createPayment(payload: CreatePaymentPayload) {
    const response = await apiClient.post('/payment/create', payload);
    return response.data;
  }
}
