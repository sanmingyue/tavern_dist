import { ref } from 'vue';

/** localStorage key 前缀 */
const AVATAR_KEY_PREFIX = 'xiuxian-avatar-';

/** 自定义头像变更版本号，用于触发 Vue 响应式更新 */
export const avatarVersion = ref(0);

/**
 * 角色立绘 URL 映射表
 * key: 角色名（需与关系列表、在场角色中的名称完全一致）
 * value: 立绘图片 URL
 */
export const CHARACTER_PORTRAITS: Record<string, string> = {
  '魔奴·七': 'https://files.catbox.moe/1ezhse.png',
  '飞羽': 'https://files.catbox.moe/v0ocx3.png',
  '青鳞': 'https://files.catbox.moe/kqdfua.png',
  '霜儿': 'https://files.catbox.moe/pxic6r.png',
  '阿狸': 'https://files.catbox.moe/sutgtu.png',
  '阿朵': 'https://files.catbox.moe/ltm8av.png',
  '阿依': 'https://files.catbox.moe/4g5ct6.png',
  '银月': 'https://files.catbox.moe/dbjsdj.png',
  '铁扇公主': 'https://files.catbox.moe/n7ysjz.png',
  '采薇': 'https://files.catbox.moe/2hiiye.png',
  '蛇姬·青鸢': 'https://files.catbox.moe/o0d7un.png',
  '苏念卿': 'https://files.catbox.moe/3kri6x.png',
  '花无缺': 'https://files.catbox.moe/z913e1.png',
  '花妖·绯': 'https://files.catbox.moe/mybrj3.png',
  '翠儿': 'https://files.catbox.moe/yap0ga.png',
  '罗刹女': 'https://files.catbox.moe/eg9mqc.png',
  '织女': 'https://files.catbox.moe/med6t7.png',
  '童谣': 'https://files.catbox.moe/13621o.png',
  '秋水寒': 'https://files.catbox.moe/7ablxa.png',
  '白灵': 'https://files.catbox.moe/932rz2.png',
  '画皮': 'https://files.catbox.moe/xnoumt.png',
  '珊瑚': 'https://files.catbox.moe/zgi9s4.png',
  '王婵': 'https://files.catbox.moe/bhbg3y.png',
  '潮汐': 'https://files.catbox.moe/66s4wl.png',
  '殇雪': 'https://files.catbox.moe/p1ynjj.png',
  '楼兰': 'https://files.catbox.moe/zlrpji.png',
  '楚瑶': 'https://files.catbox.moe/memuxx.png',
  '梵音': 'https://files.catbox.moe/01qx2v.png',
  '柳如烟': 'https://files.catbox.moe/qfq3u3.png',
  '柳倾城': 'https://files.catbox.moe/v28b4a.png',
  '杏儿': 'https://files.catbox.moe/dga50p.png',
  '木叶': 'https://files.catbox.moe/layc9h.png',
  '方巧儿': 'https://files.catbox.moe/o19pst.png',
  '巫灵': 'https://files.catbox.moe/bl79aa.png',
  '小鱼': 'https://files.catbox.moe/fj4w02.png',
  '小蛮': 'https://files.catbox.moe/ysj2ku.png',
  '小倩': 'https://files.catbox.moe/oeptsi.png',
  '容月': 'https://files.catbox.moe/vdlv28.png',
  '孟婆': 'https://files.catbox.moe/kwjtas.png',
  '姬瑶华': 'https://files.catbox.moe/htvxdd.png',
  '姜小满': 'https://files.catbox.moe/rnj6c2.png',
  '墨瞳': 'https://files.catbox.moe/3j0a72.png',
  '墨染': 'https://files.catbox.moe/otohve.png',
  '叶霜寒': 'https://files.catbox.moe/h2kibw.png',
  '冬梅': 'https://files.catbox.moe/def8xy.png',
  '明玥': 'https://files.catbox.moe/vq6uao.png',
  '冥月': 'https://files.catbox.moe/7x0wj0.png',
  '元宝': 'https://files.catbox.moe/n84c9d.png',
  '云溪': 'https://files.catbox.moe/ojet6k.png',
  '九娘': 'https://files.catbox.moe/uy50kg.png',
  '大巫祝': 'https://files.catbox.moe/t815kk.png',
  '容锦书': 'https://files.catbox.moe/ws4kjr.png',
  '谢怜舟': 'https://files.catbox.moe/ox80bo.png',
  '苏暮烟': 'https://files.catbox.moe/n8wqsd.png',
  '沈清辞': 'https://files.catbox.moe/ab1387.png',
  '柳如梦': 'https://files.catbox.moe/ppjpxc.png',
  '花千落': 'https://files.catbox.moe/h5mues.png',
  '白星': 'https://files.catbox.moe/eegnlx.png',
  '凝雨安': 'https://files.catbox.moe/xc06y7.png',
  '聆溪': 'https://files.catbox.moe/01pew1.png',
  '苏清晏': 'https://files.catbox.moe/g9h90m.png',
  '绯烟': 'https://files.catbox.moe/qfcpq0.png',
  '月姬': 'https://files.catbox.moe/jepcxr.png',
  '烛云': 'https://files.catbox.moe/oe8uno.png',
  '月咏': 'https://files.catbox.moe/dvb12j.png',
  '浅间咲': 'https://files.catbox.moe/j7io73.png',
  '赵曦月': 'https://files.catbox.moe/4p74lt.png',
  '玲涟': 'https://files.catbox.moe/hqx8q2.png',
  '罗刹雪': 'https://files.catbox.moe/zd4i11.png',
  '阴月魔妃': 'https://files.catbox.moe/l3f2b2.png',
  '灵月曦': 'https://files.catbox.moe/wv6axu.png',
  '林微月': 'https://files.catbox.moe/m693fv.png',
  '云纤纤': 'https://files.catbox.moe/85lij2.png',
  '凰': 'https://files.catbox.moe/8h20pp.png',
  '姬灵均': 'https://files.catbox.moe/3xnjqe.png',
  '姬皓月': 'https://files.catbox.moe/rf4bn5.png',
  '姬清舞': 'https://files.catbox.moe/idxvvv.png',
  '曦瑶': 'https://files.catbox.moe/gedgda.png',
  '夜千泷': 'https://files.catbox.moe/bx9bok.png',
  '林清雪': 'https://files.catbox.moe/z4uiuu.png',
  '苏青檀': 'https://files.catbox.moe/jjbfnf.png',
  '姚江雪': 'https://files.catbox.moe/znnwag.png',
  '洛溪月': 'https://files.catbox.moe/mos7dz.png',
  '羽落': 'https://files.catbox.moe/8xlxx9.png',
  '勿忘': 'https://files.catbox.moe/krlxf7.png',
  '神斩': 'https://files.catbox.moe/e700qg.png',
  '苏媚儿': 'https://files.catbox.moe/s2avm2.png',
  '柳飞絮': 'https://files.catbox.moe/7lcvhs.png',
  '梦涵': 'https://files.catbox.moe/zdaof5.png',
  '顾清霜': 'https://files.catbox.moe/j6reju.png',
  '洛幽': 'https://files.catbox.moe/hcqrj2.png',
  '夜幽': 'https://files.catbox.moe/7p98y1.png',
  '涂山玉': 'https://files.catbox.moe/xhwals.png',
  '璃月': 'https://files.catbox.moe/zru7yl.png',
  '敖凝霜': 'https://files.catbox.moe/ne2i4c.png',
  '涂山小九': 'https://files.catbox.moe/pyv0d1.png',
  '涂山鸾': 'https://files.catbox.moe/ekfg3w.png',
  '司星瑶': 'https://files.catbox.moe/we6fu2.png',
  '焚璃璇': 'https://files.catbox.moe/cv7uyh.png',
  '烈凰儿': 'https://files.catbox.moe/9a79ph.png',
  '呼延明焰': 'https://files.catbox.moe/4r26wt.png',
  '卫疏影': 'https://files.catbox.moe/dm6080.png',
  '北冥幽荧': 'https://files.catbox.moe/x9o30e.png',
  '北冥寂月': 'https://files.catbox.moe/97tolg.png',
  '云蕴': 'https://files.catbox.moe/ygcy4p.png',
  '云倾颜': 'https://files.catbox.moe/1m7oe6.png',
  '玉横枝': 'https://files.catbox.moe/8b6w0z.png',
  '幽霜瑶': 'https://files.catbox.moe/kd0w49.png',
  '殷冬雪': 'https://files.catbox.moe/41n5v3.png',
  '叶冰心': 'https://files.catbox.moe/73w2fq.png',
  '炎祯': 'https://files.catbox.moe/l65k4r.png',
  '血鸦': 'https://files.catbox.moe/9qe9li.png',
  '萧千翎': 'https://files.catbox.moe/o5l3kp.png',
  '萧凝霜': 'https://files.catbox.moe/urui3s.png',
  '苏妍': 'https://files.catbox.moe/wwz5zb.png',
  '苏清河': 'https://files.catbox.moe/51quzz.png',
  '苏雪': 'https://files.catbox.moe/uw4az3.png',
  '苏沐青': 'https://files.catbox.moe/5bubzg.png',
  '苏翎霜': 'https://files.catbox.moe/hzvbcn.png',
  '宋馨': 'https://files.catbox.moe/ybjuen.png',
  '沈艺清': 'https://files.catbox.moe/xk4v8m.png',
  '沈微澜': 'https://files.catbox.moe/o96ib9.png',
  '曲十一': 'https://files.catbox.moe/bpbss2.png',
  '秦晚烟': 'https://files.catbox.moe/hyh3rk.png',
  '洛璃': 'https://files.catbox.moe/xf7tss.png',
  '洛红尘': 'https://files.catbox.moe/hv3mlb.png',
  '绫芷澜': 'https://files.catbox.moe/3ad75c.png',
  '林月华': 'https://files.catbox.moe/iahiwq.png',
  '林寒月': 'https://files.catbox.moe/ceirbm.png',
  '怜星': 'https://files.catbox.moe/sycb5m.png',
  '黎萱': 'https://files.catbox.moe/im5qh9.png',
  '姜千青': 'https://files.catbox.moe/8kfca7.png',
  '顾千雪': 'https://files.catbox.moe/edg1k3.png',
  '风烬雪': 'https://files.catbox.moe/9l0r0t.png',
  '凌菲': 'https://files.catbox.moe/2j5sug.png',
  '苍曜·璃音': 'https://files.catbox.moe/xvweoz.png',
  '苍阙影': 'https://files.catbox.moe/b6kc7p.png',
  '白瑶光': 'https://files.catbox.moe/qov7g3.png',
  '清奶': 'https://files.catbox.moe/7pkiib.png',
};

/**
 * 获取自定义头像的 localStorage key
 */
function getAvatarKey(name: string): string {
  return AVATAR_KEY_PREFIX + name;
}

/**
 * 获取自定义头像（从 localStorage）
 */
export function getCustomAvatar(name: string): string | null {
  try {
    return window.parent.localStorage.getItem(getAvatarKey(name));
  } catch {
    return null;
  }
}

/**
 * 判断角色是否有自定义头像
 */
export function hasCustomAvatar(name: string): boolean {
  // 引用 avatarVersion 以触发响应式追踪
  void avatarVersion.value;
  return getCustomAvatar(name) !== null;
}

/**
 * 获取角色立绘 URL（自定义头像优先）
 * @param name 角色名
 * @returns 立绘 URL 或 null
 */
export function getPortraitUrl(name: string): string | null {
  // 引用 avatarVersion 以触发响应式追踪
  void avatarVersion.value;
  const custom = getCustomAvatar(name);
  if (custom) return custom;
  return CHARACTER_PORTRAITS[name] ?? null;
}

/**
 * 判断角色是否有立绘（自定义或预设）
 */
export function hasPortrait(name: string): boolean {
  // 引用 avatarVersion 以触发响应式追踪
  void avatarVersion.value;
  return hasCustomAvatar(name) || name in CHARACTER_PORTRAITS;
}

/**
 * 压缩图片并转为 base64 JPEG
 * @param file 图片文件
 * @param maxSize 最大尺寸（宽高）
 * @param quality JPEG 压缩质量
 * @returns base64 字符串
 */
export function compressImage(file: File, maxSize = 128, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round(height * maxSize / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 保存自定义头像到 localStorage
 */
export async function saveCustomAvatar(name: string, file: File): Promise<void> {
  const base64 = await compressImage(file);
  try {
    window.parent.localStorage.setItem(getAvatarKey(name), base64);
    avatarVersion.value++;
  } catch (e) {
    throw new Error('存储空间不足，请清理后重试');
  }
}

/**
 * 删除自定义头像
 */
export function removeCustomAvatar(name: string): void {
  try {
    window.parent.localStorage.removeItem(getAvatarKey(name));
    avatarVersion.value++;
  } catch {
    // ignore
  }
}
