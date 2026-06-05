import mvuRuntimeScriptRaw from '../assets/酒馆助手脚本-MVU.json?raw';

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureCharacterExtensions(character: Character): void {
  character.extensions ??= { regex_scripts: [], tavern_helper: { scripts: [], variables: {} } };
  character.extensions.regex_scripts ??= [];
  character.extensions.tavern_helper ??= { scripts: [], variables: {} };
  character.extensions.tavern_helper.scripts ??= [];
  character.extensions.tavern_helper.variables ??= {};
}

export async function installMvuSchemaScript(content: string): Promise<void> {
  await updateCharacterWith('current', character => {
    ensureCharacterExtensions(character);

    const scripts = character.extensions.tavern_helper.scripts;
    const existingIndex = scripts.findIndex(script => script.name === '变量结构' || script.scriptName === '变量结构');
    const old = existingIndex >= 0 ? scripts[existingIndex] : {};
    const nextScript = {
      ...old,
      name: '变量结构',
      id: old.id ?? randomId('qz-mvu-schema'),
      enabled: true,
      type: 'script',
      content,
      info: '自动生成的 MVU 变量结构脚本。',
      button: old.button ?? { enabled: true, buttons: [] },
      data: old.data ?? {},
    };

    if (existingIndex >= 0) scripts[existingIndex] = nextScript;
    else scripts.push(nextScript);
    return character;
  });
}

export async function installMvuRuntimeScript(): Promise<void> {
  const runtimeScript = JSON.parse(mvuRuntimeScriptRaw) as Record<string, any>;

  await updateCharacterWith('current', character => {
    ensureCharacterExtensions(character);

    const scripts = character.extensions.tavern_helper.scripts;
    const targetName = String(runtimeScript.name ?? 'MVU');
    const existingIndex = scripts.findIndex(script => {
      const scriptName = String(script.name ?? script.scriptName ?? '');
      return script.id === runtimeScript.id || scriptName.toLowerCase() === targetName.toLowerCase();
    });
    const old = existingIndex >= 0 ? scripts[existingIndex] : {};
    const nextScript = {
      ...old,
      ...runtimeScript,
      name: targetName,
      id: runtimeScript.id ?? old.id ?? randomId('qz-mvu-runtime'),
      enabled: true,
      type: runtimeScript.type ?? old.type ?? 'script',
      content: runtimeScript.content ?? old.content ?? '',
      button: runtimeScript.button ?? old.button ?? { enabled: true, buttons: [] },
      data: runtimeScript.data ?? old.data ?? {},
    };

    if (existingIndex >= 0) scripts[existingIndex] = nextScript;
    else scripts.push(nextScript);
    return character;
  });
}

export async function updateCurrentAvatar(file: File | null): Promise<void> {
  if (!file) return;
  await updateCharacterWith('current', character => {
    character.avatar = file;
    return character;
  });
}
