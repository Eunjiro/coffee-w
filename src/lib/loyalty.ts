import axios from "axios";

const LOYALTY_API_BASE = "http://localhost:3001/api/loyalty"; // replace with your Loyalty System URL

export const addPoints = async (orderRef: string, phone: string, totalAmount: number, items: any[]) => {
  const res = await axios.post(`${LOYALTY_API_BASE}/addPoints`, {
    orderRef,
    customerPhone: phone,
    totalAmount,
    items,
  });
  return res.data;
};

export const getBalance = async (phone: string) => {
  const res = await axios.get(`${LOYALTY_API_BASE}/getBalance`, { params: { phone } });
  return res.data;
};

export const redeemReward = async (phone: string, rewardId: number, orderRef: string) => {
  const res = await axios.post(`${LOYALTY_API_BASE}/redeemReward`, {
    phone,
    rewardId,
    orderRef,
  });
  return res.data;
};
