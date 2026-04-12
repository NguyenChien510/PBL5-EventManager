import { apiClient } from "@/utils/axios";
import type { User, UserProfileOverview } from "@/types";

export async function fetchProfileOverview(): Promise<UserProfileOverview> {
  const { data } = await apiClient.get<UserProfileOverview>("/users/me/overview");
  return {
    ...data,
    wallet: {
      ...data.wallet,
      balance: Number(data.wallet.balance),
    },
  };
}

export async function updateProfile(body: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/me/profile", body);
  return data;
}

export async function topUpWallet(amount: number): Promise<{
  balance: number;
  cardLastFour: string | null;
}> {
  const { data } = await apiClient.post<{
    balance: number;
    cardLastFour: string | null;
  }>("/users/me/wallet/top-up", { amount });
  return {
    balance: Number(data.balance),
    cardLastFour: data.cardLastFour,
  };
}

export async function linkWalletCard(cardLastFour: string): Promise<{
  balance: number;
  cardLastFour: string | null;
}> {
  const { data } = await apiClient.patch<{
    balance: number;
    cardLastFour: string | null;
  }>("/users/me/wallet/card", { cardLastFour });
  return {
    balance: Number(data.balance),
    cardLastFour: data.cardLastFour,
  };
}
