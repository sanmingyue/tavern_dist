export type PriceEntry = {
  id: string;
  name: string;
  min: number;
  max: number;
  source: string;
};

export const priceTable: PriceEntry[] = [
  { id: 'water', name: '矿泉水', min: 2, max: 5, source: '便利店' },
  { id: 'breakfast', name: '早餐', min: 8, max: 25, source: '餐饮' },
  { id: 'coffee', name: '咖啡', min: 15, max: 38, source: '餐饮' },
];
