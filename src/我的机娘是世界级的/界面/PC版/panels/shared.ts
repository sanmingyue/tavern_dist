/** 五维维度定义 */
export const dimensions = [
  { key: '加速度' as const, label: 'ACC', color: '#ef4444', barClass: 'acc' },
  { key: '极速' as const, label: 'SPD', color: '#f59e0b', barClass: 'spd' },
  { key: '操控' as const, label: 'HDL', color: '#06b6d4', barClass: 'hdl' },
  { key: '漂移' as const, label: 'DFT', color: '#8b5cf6', barClass: 'dft' },
  { key: '耐久' as const, label: 'END', color: '#10b981', barClass: 'end' },
];

/** 排名样式 */
export function rankClass(rank: number): string {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-default';
}
