import { Schema } from '../schema';

/** CDN 图片基础路径 */
const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@fruit-v5.0.0/dist/青春的果实/青春的果实图片';

/** 角色元信息 */
export interface CharacterMeta {
  name: string;
  identity: string;
  type: 'student' | 'teacher' | 'family';
  intro: string;
  /** 角色主题色调，用于卡片背景渐变 */
  color: string;
  /** 状态栏人设图（CDN 链接） */
  image: string;
}

export const CHARACTER_LIST: CharacterMeta[] = [
  { name: '洛月', identity: '同班同学', type: 'student', intro: '年级前三的苏州姑娘，按快门之前会看很久', color: '#1e3a5f', image: `${CDN_BASE}/luoyue.jpg` },
  { name: '苏晴', identity: '语文老师', type: 'teacher', intro: '温柔的语文老师，一个人的晚餐做得很认真', color: '#4a2c5e', image: `${CDN_BASE}/suqing.jpg` },
  { name: '沈曼莎', identity: '班主任', type: 'teacher', intro: '说话中英文夹杂的海归，等得起', color: '#2e4a3a', image: `${CDN_BASE}/shenmansha.jpg` },
  { name: '宋雨欣', identity: '同班同学', type: 'student', intro: '被叫校花的书法少女，练字时最像自己', color: '#3d2a4f', image: `${CDN_BASE}/songyuxin.jpg` },
  { name: '司菲', identity: '同班同学', type: 'student', intro: '全校都知道她在追你，大声是她的保护方式', color: '#5a2a1e', image: `${CDN_BASE}/sifei.jpg` },
  { name: '慕言', identity: '同班同学', type: 'student', intro: '学生会长，笔记本里你的名字旁边有个问号', color: '#1e2a4a', image: `${CDN_BASE}/muyan.jpg` },
  { name: '云初夏', identity: '同班同学', type: 'student', intro: '你最铁的兄弟，深夜会一个人听粤语老歌', color: '#1e4a3a', image: `${CDN_BASE}/yunchuxia.jpg` },
  { name: '厉莎', identity: '校医', type: 'teacher', intro: '双博士校医，说话平缓，看人很准', color: '#3a1e2e', image: `${CDN_BASE}/lisha.jpg` },
  { name: '洛蓉', identity: '同班同学', type: 'student', intro: '洛月的表妹，嘴上全是毒舌心里全是柔软', color: '#2a3a5a', image: `${CDN_BASE}/luorong.jpg` },
  { name: '苏琪', identity: '同班同学', type: 'student', intro: '宋雨欣的闺蜜，习惯把自己藏在距离后面', color: '#3a3a2a', image: `${CDN_BASE}/suqi.jpg` },
  { name: '程妞妞', identity: '表侄女', type: 'family', intro: '你的小表侄女，河南口音，把你当专属靠山', color: '#5a3a1e', image: `${CDN_BASE}/chengniuniu.jpg` },
];

export const useStatusStore = defineStore('status-bar', () => {
  const data = ref(Schema.parse({}));

  // 初始化：从 MVU 读取最新楼层变量
  async function init() {
    await waitGlobalInitialized('Mvu');
    refresh();

    // 监听变量更新事件，实时刷新
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
      console.warn('[状态栏] 读取 MVU 变量失败:', e);
    }
  }

  /** 获取角色数据 */
  function getCharacter(name: string) {
    const char = _.get(data.value, name) as
      | { 好感度: number; 关系状态: string; 关键事件: Record<string, boolean> }
      | undefined;
    return char ?? { 好感度: 0, 关系状态: '初识', 关键事件: {} };
  }

  /** 计算高考倒计时天数 */
  const countdown = computed(() => {
    // 高考日期固定为 6月7日
    const dateStr = data.value.当前日期;
    // 尝试从日期字符串中解析月日
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (!match) return null;
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    // 假设当前年份，高考为 6月7日
    const now = new Date(2026, month - 1, day);
    const gaokao = new Date(2026, 5, 7); // 6月7日
    const diff = Math.ceil((gaokao.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  });

  /** 获取星期几 */
  const weekday = computed(() => {
    const dateStr = data.value.当前日期;
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (!match) return '';
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const date = new Date(2026, month - 1, day);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  });

  return { data, init, refresh, getCharacter, countdown, weekday };
});
