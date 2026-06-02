import { apiClient } from "@/utils/axios";

export class CouponService {
  static async getMyCoupons() {
    const response = await apiClient.get('/coupons/my');
    return response.data;
  }

  static async getAvailableCoupons() {
    const response = await apiClient.get('/coupons/available');
    return response.data;
  }

  static async exchangeCoupon(couponId: number) {
    const response = await apiClient.post(`/coupons/exchange?couponId=${couponId}`);
    return response.data;
  }
}
