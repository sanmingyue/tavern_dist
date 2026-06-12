import { Schema } from '../schema';

/** CDN 图片基础路径 */
const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@onion-v0.0.2/dist/一脸嫌弃给你看胖次的onion/状态栏/assets';

/** 背景图 CDN 链接 */
export const BG_IMAGE = `${CDN_BASE}/ig_0031a886394f7538016a1d6c5b9cac8197964c8b60c7145651.png`;

/** 头像 CDN 链接 */
export const AVATAR_IMAGE = `${CDN_BASE}/03_竖版角色卡面_onion_结构修正版.png`;

export const useStatusStore = defineStore('onion-status', () => {
  const data = ref(Schema.parse({}));

  async function init() {
    await waitGlobalInitialized('Mvu');
    refresh();

    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      refresh();
    });
  }

  function refresh() {
    try {
      const variables = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const stat_data = _.get(variables, 'stat_data', {});
      const result = Schema.safeParse(stat_data);
      if (result.data) {
        data.value = result.data;
      }
    } catch (e) {
      console.warn('[onion状态栏] 读取 MVU 变量失败:', e);
    }
  }

  /** 关系阶段描述 */
  const relationLabel = computed(() => data.value.关系状态);

  /** 交易进度描述 */
  const tradeProgress = computed(() => {
    const count = data.value.交易次数;
    if (count <= 3) return '初期';
    if (count <= 8) return '中期';
    if (count <= 15) return '深入期';
    return '后期';
  });

  return { data, init, refresh, relationLabel, tradeProgress };
});
