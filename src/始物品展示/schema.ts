const ItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  interactions: z.array(z.record(z.string(), z.string())).prefault([]),
});

export const Schema = z.object({
  当前房间: z.string().prefault('第一层·起始之间'),
  主角: z.object({
    持有物品: z.array(ItemSchema).prefault([]),
  }).prefault({}),
  场景物品: z.array(ItemSchema).prefault([]),
});

export type ItemData = z.infer<typeof ItemSchema>;
