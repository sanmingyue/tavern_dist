export interface Festival {
  id: string;
  name: string;
  month: number;
  day: number;
  description?: string;
}

export const festivals: Festival[] = [
  { id: 'new_year', name: '元旦', month: 1, day: 1 },
  { id: 'lanjing_city_day', name: '澜景市民日', month: 5, day: 15 },
  { id: 'national_day', name: '国庆节', month: 10, day: 1 },
];
