// ─── 常量 ───
export const CONFIG_PROMPT_NAME = 'Sanmingyue';
export const STORAGE_KEY = 'chaoxi-preset-fab-pos';
export const PANEL_SIZE_KEY = 'chaoxi-preset-panel-size';
export const PRESET_GROUPS_KEY = 'chaoxi-preset-groups';
export const PRESET_NOTES_KEY = 'chaoxi-preset-notes';
export const EDGE_GAP = 12;
export const FAB_SIZE = 44;
export const DRAG_THRESHOLD = 3;
export const DEFAULT_PANEL_W = 1000;
export const DEFAULT_PANEL_H = 800;
export const MIN_PANEL_W = 400;
export const MIN_PANEL_H = 300;

// ─── 类型 ───
export interface CustomGroup {
  id: string;
  name: string;
  promptNames: string[];
}

export interface ChaoxiConfig {
  groups: CustomGroup[];
}

export interface PromptItem {
  name: string;
  displayName: string;
  enabled: boolean;
  hasContent: boolean;
  content: string;
  role: string;
  originalIndex: number;
}

// ─── 工具函数 ───

/** 去除 emoji 前缀，只显示关键名称 */
export function stripEmoji(name: string): string {
  return name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || name;
}

/** 判断是否为配置条目（应隐藏） */
export function isConfigPrompt(name: string): boolean {
  return name === CONFIG_PROMPT_NAME;
}

/** 从预设中获取所有可显示的 prompt */
export function getVisiblePrompts(): PromptItem[] {
  const preset = getPreset('in_use');
  const items: PromptItem[] = [];
  let idx = 0;

  for (const p of preset.prompts) {
    if (!isPresetNormalPrompt(p) && !isPresetSystemPrompt(p)) continue;
    if (isConfigPrompt(p.name)) continue;
    items.push({
      name: p.name,
      displayName: stripEmoji(p.name),
      enabled: p.enabled,
      hasContent: 'content' in p,
      content: p.content ?? '',
      role: p.role ?? 'system',
      originalIndex: idx,
    });
    idx++;
  }

  return items;
}

/** 获取可显示 prompt 的总数 */
export function getVisiblePromptCount(): number {
  const preset = getPreset('in_use');
  let count = 0;
  for (const p of preset.prompts) {
    if (!isPresetNormalPrompt(p) && !isPresetSystemPrompt(p)) continue;
    if (isConfigPrompt(p.name)) continue;
    count++;
  }
  return count;
}

// ─── 配置存储（Sanmingyue 条目） ───

/** 读取分组配置 */
export function readConfig(): ChaoxiConfig {
  try {
    const preset = getPreset('in_use');
    const p = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === CONFIG_PROMPT_NAME,
    );
    if (p?.content) {
      return JSON.parse(p.content) as ChaoxiConfig;
    }
  } catch {
    /* ignore */
  }
  return { groups: [] };
}

/** 保存分组配置 */
export async function saveConfig(config: ChaoxiConfig): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const existing = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === CONFIG_PROMPT_NAME,
    );
    if (existing) {
      existing.content = JSON.stringify(config);
      existing.enabled = false;
    } else {
      preset.prompts.push({
        id: 'sanmingyue_config',
        name: CONFIG_PROMPT_NAME,
        enabled: false,
        position: { type: 'relative' },
        role: 'system',
        content: JSON.stringify(config),
      });
    }
    return preset;
  });
}

// ─── 预设操作函数 ───

/** 切换条目开关 */
export async function togglePromptEnabled(name: string, currentEnabled: boolean): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const p = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
    );
    if (p) p.enabled = !currentEnabled;
    return preset;
  });
}

/** 批量设置条目开关 */
export async function batchSetEnabled(names: string[], enabled: boolean): Promise<void> {
  const nameSet = new Set(names);
  await updatePresetWith('in_use', preset => {
    for (const p of preset.prompts) {
      if ((isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && nameSet.has(p.name)) {
        p.enabled = enabled;
      }
    }
    return preset;
  });
}

/** 批量删除条目 */
export async function batchDeletePrompts(names: string[]): Promise<void> {
  const nameSet = new Set(names);
  await updatePresetWith('in_use', preset => {
    preset.prompts = preset.prompts.filter(p => {
      if ((isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && nameSet.has(p.name)) {
        return false;
      }
      return true;
    });
    return preset;
  });
}

/** 新建条目 */
export async function createPrompt(name: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    preset.prompts.push({
      id: `custom_${Date.now()}`,
      name,
      enabled: true,
      position: { type: 'relative' },
      role: 'system',
      content: '',
    });
    return preset;
  });
}

/** 删除条目 */
export async function deletePrompt(name: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const idx = preset.prompts.findIndex(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
    );
    if (idx >= 0) preset.prompts.splice(idx, 1);
    return preset;
  });
}

/** 移动条目 */
export async function movePrompt(name: string, direction: -1 | 1): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const idx = preset.prompts.findIndex(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
    );
    const targetIdx = idx + direction;
    if (idx >= 0 && targetIdx >= 0 && targetIdx < preset.prompts.length) {
      [preset.prompts[idx], preset.prompts[targetIdx]] = [preset.prompts[targetIdx], preset.prompts[idx]];
    }
    return preset;
  });
}

/** 拖拽移动条目到指定位置 */
export async function movePromptToIndex(fromName: string, toName: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const fromIdx = preset.prompts.findIndex(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === fromName,
    );
    const toIdx = preset.prompts.findIndex(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === toName,
    );
    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      const [item] = preset.prompts.splice(fromIdx, 1);
      preset.prompts.splice(toIdx, 0, item);
    }
    return preset;
  });
}

/** 复制条目 */
export async function duplicatePrompt(name: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const src = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
    );
    if (src) {
      const idx = preset.prompts.indexOf(src);
      const clone = {
        ...JSON.parse(JSON.stringify(src)),
        id: `custom_${Date.now()}`,
        name: `${src.name} (副本)`,
      };
      preset.prompts.splice(idx + 1, 0, clone);
    }
    return preset;
  });
}

/** 重命名条目 */
export async function renamePrompt(oldName: string, newName: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const p = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === oldName,
    );
    if (p) p.name = newName;
    return preset;
  });
}

/** 保存条目内容 */
export async function savePromptContent(name: string, content: string): Promise<void> {
  await updatePresetWith('in_use', preset => {
    const p = preset.prompts.find(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === name,
    );
    if (p && 'content' in p) p.content = content;
    return preset;
  });
}

// ─── 面板尺寸持久化 ───
const hostWindow = window.parent;

export function readPanelSize(): { w: number; h: number } {
  try {
    const raw = hostWindow.localStorage.getItem(PANEL_SIZE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { w: DEFAULT_PANEL_W, h: DEFAULT_PANEL_H };
}

export function savePanelSize(size: { w: number; h: number }): void {
  try {
    hostWindow.localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(size));
  } catch {
    /* ignore */
  }
}

// ─── 预设管理函数 ───

export interface PresetInfo {
  name: string;
  promptCount: number;
  isActive: boolean;
  hasRegex: boolean;
  regexCount: number;
}

/** 获取所有预设的摘要信息 */
export function getAllPresetInfos(): PresetInfo[] {
  const names = getPresetNames();
  const loadedName = getLoadedPresetName();
  return names.map(name => {
    try {
      const preset = getPreset(name);
      const promptCount = preset.prompts.filter(
        p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && !isConfigPrompt(p.name),
      ).length;
      const regexScripts = preset.extensions?.regex_scripts ?? [];
      return {
        name,
        promptCount,
        isActive: name === loadedName,
        hasRegex: regexScripts.length > 0,
        regexCount: regexScripts.length,
      };
    } catch {
      return {
        name,
        promptCount: 0,
        isActive: name === loadedName,
        hasRegex: false,
        regexCount: 0,
      };
    }
  });
}

/** 切换预设并确保正则生效 */
export async function switchPreset(presetName: string): Promise<boolean> {
  const success = loadPreset(presetName);
  if (!success) return false;

  // 等待酒馆内部处理完毕
  await new Promise(resolve => setTimeout(resolve, 300));

  // 检查预设正则是否需要同步
  try {
    const targetPreset = getPreset(presetName);
    const targetRegexes = targetPreset.extensions?.regex_scripts ?? [];

    if (targetRegexes.length > 0) {
      // 确保 in_use 预设的正则与目标预设一致
      const inUsePreset = getPreset('in_use');
      const inUseRegexes = inUsePreset.extensions?.regex_scripts ?? [];

      // 对比正则 id 是否一致
      const targetIds = new Set(targetRegexes.map((r: any) => r.id));
      const inUseIds = new Set(inUseRegexes.map((r: any) => r.id));
      const needsSync = targetIds.size !== inUseIds.size || [...targetIds].some(id => !inUseIds.has(id));

      if (needsSync) {
        await updatePresetWith('in_use', preset => {
          preset.extensions.regex_scripts = JSON.parse(JSON.stringify(targetRegexes));
          return preset;
        });
      }
    }
  } catch (e) {
    console.warn('[潮汐预设脚本] 正则同步检查失败:', e);
  }

  return true;
}

/** 前端导入预设文件 */
export function triggerPresetImport(): Promise<{ success: boolean; name: string }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ success: false, name: '' });
        return;
      }

      try {
        const content = await file.text();
        const result = await importRawPreset(file.name, content);
        resolve({ success: result, name: file.name.replace(/\.json$/i, '') });
      } catch (e) {
        console.error('[潮汐预设脚本] 导入预设失败:', e);
        resolve({ success: false, name: '' });
      } finally {
        input.remove();
      }
    });

    input.addEventListener('cancel', () => {
      resolve({ success: false, name: '' });
      input.remove();
    });

    document.body.appendChild(input);
    input.click();
  });
}

/** 获取指定预设的可显示条目 */
export function getPresetPrompts(presetName: string): PromptItem[] {
  try {
    const preset = getPreset(presetName);
    const items: PromptItem[] = [];
    let idx = 0;

    for (const p of preset.prompts) {
      if (!isPresetNormalPrompt(p) && !isPresetSystemPrompt(p)) continue;
      if (isConfigPrompt(p.name)) continue;
      items.push({
        name: p.name,
        displayName: stripEmoji(p.name),
        enabled: p.enabled,
        hasContent: 'content' in p,
        content: p.content ?? '',
        role: p.role ?? 'system',
        originalIndex: idx,
      });
      idx++;
    }

    return items;
  } catch {
    return [];
  }
}

/** 跨预设复制条目 */
export async function copyPromptsToPreset(
  sourcePresetName: string,
  targetPresetName: string,
  promptNames: string[],
): Promise<boolean> {
  try {
    const sourcePreset = getPreset(sourcePresetName);
    const nameSet = new Set(promptNames);
    const toCopy = sourcePreset.prompts.filter(
      p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && nameSet.has(p.name),
    );

    if (toCopy.length === 0) return false;

    await updatePresetWith(targetPresetName, preset => {
      for (const src of toCopy) {
        // 检查目标是否已有同名条目
        const existingIdx = preset.prompts.findIndex(
          p => (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === src.name,
        );
        const clone = JSON.parse(JSON.stringify(src));
        clone.id = `copied_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        if (existingIdx >= 0) {
          // 替换已有同名条目
          preset.prompts[existingIdx] = clone;
        } else {
          // 追加到末尾
          preset.prompts.push(clone);
        }
      }
      return preset;
    });

    return true;
  } catch (e) {
    console.error('[潮汐预设脚本] 跨预设复制失败:', e);
    return false;
  }
}

// ─── 预设生命周期操作 ───

/** 保存当前 in_use 的修改回原始预设 */
export async function saveCurrentPreset(): Promise<boolean> {
  try {
    const loadedName = getLoadedPresetName();
    const inUse = getPreset('in_use');
    await replacePreset(loadedName, inUse);
    return true;
  } catch (e) {
    console.error('[潮汐预设脚本] 保存预设失败:', e);
    return false;
  }
}

/** 导出预设为 JSON 文件下载 */
export function exportPreset(presetName: string): void {
  try {
    const preset = getPreset(presetName);
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presetName}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  } catch (e) {
    console.error('[潮汐预设脚本] 导出预设失败:', e);
  }
}

/** 删除预设 */
export async function removePreset(presetName: string): Promise<boolean> {
  try {
    return await deletePreset(presetName);
  } catch (e) {
    console.error('[潮汐预设脚本] 删除预设失败:', e);
    return false;
  }
}

/** 重命名预设 */
export async function renamePresetName(oldName: string, newName: string): Promise<boolean> {
  try {
    return await renamePreset(oldName, newName);
  } catch (e) {
    console.error('[潮汐预设脚本] 重命名预设失败:', e);
    return false;
  }
}

/** 克隆预设 */
export async function clonePreset(sourceName: string, newName: string): Promise<boolean> {
  try {
    const source = getPreset(sourceName);
    return await createPreset(newName, JSON.parse(JSON.stringify(source)));
  } catch (e) {
    console.error('[潮汐预设脚本] 克隆预设失败:', e);
    return false;
  }
}

/** 获取预设常用参数 */
export interface PresetParams {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_context: number;
  max_completion_tokens: number;
  should_stream: boolean;
  reasoning_effort: string;
}

export function getPresetParams(presetName: string): PresetParams {
  const preset = getPreset(presetName);
  const s = preset.settings;
  return {
    temperature: s.temperature,
    top_p: s.top_p,
    top_k: s.top_k,
    min_p: s.min_p,
    frequency_penalty: s.frequency_penalty,
    presence_penalty: s.presence_penalty,
    max_context: s.max_context,
    max_completion_tokens: s.max_completion_tokens,
    should_stream: s.should_stream,
    reasoning_effort: s.reasoning_effort,
  };
}

/** 更新预设参数 */
export async function updatePresetParams(presetName: string, params: Partial<PresetParams>): Promise<void> {
  await updatePresetWith(presetName, preset => {
    if (params.temperature !== undefined) preset.settings.temperature = params.temperature;
    if (params.top_p !== undefined) preset.settings.top_p = params.top_p;
    if (params.top_k !== undefined) preset.settings.top_k = params.top_k;
    if (params.min_p !== undefined) preset.settings.min_p = params.min_p;
    if (params.frequency_penalty !== undefined) preset.settings.frequency_penalty = params.frequency_penalty;
    if (params.presence_penalty !== undefined) preset.settings.presence_penalty = params.presence_penalty;
    if (params.max_context !== undefined) preset.settings.max_context = params.max_context;
    if (params.max_completion_tokens !== undefined) preset.settings.max_completion_tokens = params.max_completion_tokens;
    if (params.should_stream !== undefined) preset.settings.should_stream = params.should_stream;
    if (params.reasoning_effort !== undefined) preset.settings.reasoning_effort = params.reasoning_effort as any;
    return preset;
  });
}

// ─── 预设分组（localStorage） ───

export interface PresetGroupItem {
  id: string;
  name: string;
  presetNames: string[];
}

export function readPresetGroups(): PresetGroupItem[] {
  try {
    const raw = hostWindow.localStorage.getItem(PRESET_GROUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function savePresetGroups(groups: PresetGroupItem[]): void {
  try {
    hostWindow.localStorage.setItem(PRESET_GROUPS_KEY, JSON.stringify(groups));
  } catch { /* ignore */ }
}

// ─── 预设备注（localStorage） ───

export function readPresetNotes(): Record<string, string> {
  try {
    const raw = hostWindow.localStorage.getItem(PRESET_NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function savePresetNotes(notes: Record<string, string>): void {
  try {
    hostWindow.localStorage.setItem(PRESET_NOTES_KEY, JSON.stringify(notes));
  } catch { /* ignore */ }
}

export function getPresetNote(name: string): string {
  return readPresetNotes()[name] ?? '';
}

export function setPresetNote(name: string, note: string): void {
  const notes = readPresetNotes();
  if (note.trim()) {
    notes[name] = note.trim();
  } else {
    delete notes[name];
  }
  savePresetNotes(notes);
}

// ─── 预设正则操作 ───

export interface RegexItem {
  id: string;
  scriptName: string;
  enabled: boolean;
  findRegex: string;
  replaceString: string;
  sourceUserInput: boolean;
  sourceAiOutput: boolean;
  sourceSlashCommand: boolean;
  sourceWorldInfo: boolean;
  destDisplay: boolean;
  destPrompt: boolean;
  runOnEdit: boolean;
  minDepth: number | null;
  maxDepth: number | null;
}

/** 从预设中获取正则列表 */
export function getPresetRegexes(presetName: string): RegexItem[] {
  try {
    const preset = getPreset(presetName);
    const scripts: TavernRegex[] = preset.extensions?.regex_scripts ?? [];
    return scripts.map(r => ({
      id: r.id,
      scriptName: r.script_name,
      enabled: r.enabled,
      findRegex: r.find_regex,
      replaceString: r.replace_string,
      sourceUserInput: r.source?.user_input ?? false,
      sourceAiOutput: r.source?.ai_output ?? false,
      sourceSlashCommand: r.source?.slash_command ?? false,
      sourceWorldInfo: r.source?.world_info ?? false,
      destDisplay: r.destination?.display ?? false,
      destPrompt: r.destination?.prompt ?? false,
      runOnEdit: r.run_on_edit ?? false,
      minDepth: r.min_depth,
      maxDepth: r.max_depth,
    }));
  } catch {
    return [];
  }
}

/** 切换预设正则开关 */
export async function togglePresetRegex(presetName: string, regexId: string): Promise<void> {
  await updatePresetWith(presetName, preset => {
    const scripts: TavernRegex[] = preset.extensions?.regex_scripts ?? [];
    const r = scripts.find(s => s.id === regexId);
    if (r) r.enabled = !r.enabled;
    return preset;
  });
}

/** 移动预设正则位置 */
export async function movePresetRegex(presetName: string, regexId: string, direction: -1 | 1): Promise<void> {
  await updatePresetWith(presetName, preset => {
    const scripts: TavernRegex[] = preset.extensions?.regex_scripts ?? [];
    const idx = scripts.findIndex(s => s.id === regexId);
    const targetIdx = idx + direction;
    if (idx >= 0 && targetIdx >= 0 && targetIdx < scripts.length) {
      [scripts[idx], scripts[targetIdx]] = [scripts[targetIdx], scripts[idx]];
    }
    return preset;
  });
}

/** 更新预设正则内容 */
export async function updatePresetRegex(
  presetName: string,
  regexId: string,
  updates: { findRegex?: string; replaceString?: string; enabled?: boolean },
): Promise<void> {
  await updatePresetWith(presetName, preset => {
    const scripts: TavernRegex[] = preset.extensions?.regex_scripts ?? [];
    const r = scripts.find(s => s.id === regexId);
    if (r) {
      if (updates.findRegex !== undefined) r.find_regex = updates.findRegex;
      if (updates.replaceString !== undefined) r.replace_string = updates.replaceString;
      if (updates.enabled !== undefined) r.enabled = updates.enabled;
    }
    return preset;
  });
}
