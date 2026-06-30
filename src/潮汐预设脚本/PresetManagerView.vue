呃
<template>
  <div class="chaoxi-manager-view" :class="{ mobile: isMobile }">
    <!-- 工具栏 -->
    <div class="chaoxi-manager-toolbar">
      <div class="chaoxi-manager-toolbar-left">
        <span class="chaoxi-manager-label">预设列表</span>
        <span class="chaoxi-manager-count">{{ filteredPresets.length }} 个</span>
      </div>
      <div class="chaoxi-manager-toolbar-right">
        <!-- 保存当前预设 -->
        <button class="chaoxi-manager-btn chaoxi-btn-save-preset" @click="onSaveCurrentPreset" title="保存当前修改到原始预设">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span v-if="!isMobile">保存</span>
        </button>
        <!-- 导入预设 -->
        <button class="chaoxi-manager-btn" @click="onImportPreset" title="导入预设">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span v-if="!isMobile">导入</span>
        </button>
        <!-- 刷新 -->
        <button class="chaoxi-manager-btn" @click="refresh" title="刷新列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 预设分组标签栏 -->
    <div class="chaoxi-group-tabs">
      <button class="chaoxi-group-tab" :class="{ active: activeGroupFilter === '__all__' }" @click="activeGroupFilter = '__all__'">全部</button>
      <button v-for="g in presetGroups" :key="g.id" class="chaoxi-group-tab" :class="{ active: activeGroupFilter === g.id }" @click="activeGroupFilter = g.id" @dblclick="onRenamePresetGroup(g.id)">
        {{ g.name }}
        <span class="chaoxi-group-tab-del" @click.stop="onDeletePresetGroup(g.id)" title="删除分组">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </span>
      </button>
      <button class="chaoxi-group-tab chaoxi-group-tab-add" @click="onCreatePresetGroup" title="新建分组">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
    </div>

    <!-- 主体 -->
    <div class="chaoxi-manager-body" :class="{ 'has-detail': !!selectedPreset }">
      <!-- 预设列表 -->
      <div class="chaoxi-preset-list" :class="{ collapsed: isMobile && !!selectedPreset }">
        <div v-for="info in filteredPresets" :key="info.name" class="chaoxi-preset-card" :class="{ active: info.isActive, selected: selectedPreset === info.name, 'has-banner': isSanmingyuePreset(info.name) || isNemoPreset(info.name) }" :style="getPresetBannerStyle(info.name)" @click="onSelectPreset(info.name)">
          <div class="chaoxi-preset-card-main">
            <div class="chaoxi-preset-card-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div class="chaoxi-preset-card-info">
              <span class="chaoxi-preset-card-name" :title="info.name">
                {{ info.name }}
                <img v-if="isIzumiPreset(info.name)" :src="IZUMI_AVATAR" class="chaoxi-izumi-avatar" alt="izumi" />
              </span>
              <span class="chaoxi-preset-card-meta">{{ info.promptCount }} 条目<template v-if="info.hasRegex"> · {{ info.regexCount }} 正则</template></span>
              <span v-if="presetNotes[info.name]" class="chaoxi-preset-card-note" :title="presetNotes[info.name]">{{ presetNotes[info.name] }}</span>
            </div>
            <div class="chaoxi-preset-card-badges">
              <span v-if="info.isActive" class="chaoxi-badge chaoxi-badge-active">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                当前
              </span>
            </div>
          </div>
          <div class="chaoxi-preset-card-actions" @click.stop>
            <button v-if="!info.isActive" class="chaoxi-preset-action-btn" @click="onSwitchPreset(info.name)" title="切换">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button class="chaoxi-preset-action-btn chaoxi-action-more" @click="openPresetMenu(info.name, $event)" title="更多">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
            </button>
          </div>
        </div>
        <div v-if="filteredPresets.length === 0" class="chaoxi-empty">暂无预设</div>
      </div>

      <!-- 右侧详情 -->
      <div v-if="selectedPreset" class="chaoxi-preset-detail">
        <div class="chaoxi-detail-header" :class="{ 'has-banner': isSanmingyuePreset(selectedPreset) || isNemoPreset(selectedPreset) }" :style="getPresetBannerStyle(selectedPreset)">
          <button v-if="isMobile" class="chaoxi-detail-back" @click="selectedPreset = ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            返回
          </button>
          <span class="chaoxi-detail-title">{{ selectedPreset }}</span>
          <div class="chaoxi-detail-actions-top">
            <button v-if="!selectedPresetIsActive" class="chaoxi-manager-btn chaoxi-btn-switch" @click="onSwitchPreset(selectedPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              切换
            </button>
          </div>
        </div>

        <!-- 备注 -->
        <div class="chaoxi-note-bar">
          <template v-if="!editingNote">
            <span class="chaoxi-note-text" :class="{ empty: !currentNote }" @click="startEditNote">{{ currentNote || '无备注，点击添加' }}</span>
            <button class="chaoxi-note-edit-btn" @click="startEditNote" title="编辑备注">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
          </template>
          <template v-else>
            <input class="chaoxi-note-input" v-model="noteValue" placeholder="输入备注..." spellcheck="false" @keydown.enter="saveNote" @keydown.escape="editingNote = false" ref="noteInputRef" />
            <button class="chaoxi-note-save-btn" @click="saveNote">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          </template>
        </div>

        <!-- 条目/正则/参数 切换 -->
        <div class="chaoxi-detail-tabs">
          <button class="chaoxi-detail-tab" :class="{ active: detailTab === 'prompts' }" @click="detailTab = 'prompts'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            条目
          </button>
          <button class="chaoxi-detail-tab" :class="{ active: detailTab === 'regex' }" @click="detailTab = 'regex'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            正则
          </button>
          <button class="chaoxi-detail-tab" :class="{ active: detailTab === 'params' }" @click="loadParams(); detailTab = 'params'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            参数
          </button>
        </div>

        <!-- 条目列表 -->
        <template v-if="detailTab === 'prompts'">
          <div class="chaoxi-detail-toolbar">
            <div class="chaoxi-detail-toolbar-left">
              <input type="checkbox" class="chaoxi-checkbox" :checked="allDetailSelected" :indeterminate="someDetailSelected && !allDetailSelected" @change="toggleDetailSelectAll" />
              <span class="chaoxi-detail-sel-info">
                <template v-if="detailSelectedNames.size > 0">已选 {{ detailSelectedNames.size }} 项</template>
                <template v-else>{{ detailPrompts.length }} 个条目</template>
              </span>
            </div>
            <div class="chaoxi-detail-toolbar-right" v-if="detailSelectedNames.size > 0">
              <button class="chaoxi-manager-btn" @click="showCopyTarget = true" title="复制到其他预设">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                复制到...
              </button>
            </div>
          </div>
          <div class="chaoxi-detail-list">
            <div v-for="item in detailPrompts" :key="item.name" class="chaoxi-detail-item" :class="{ selected: detailSelectedNames.has(item.name) }">
              <input type="checkbox" class="chaoxi-checkbox" :checked="detailSelectedNames.has(item.name)" @change="toggleDetailSelect(item.name)" />
              <span class="chaoxi-detail-item-name" :title="item.name">{{ item.displayName }}</span>
              <span class="chaoxi-role-tag" :class="`chaoxi-role-${item.role}`">{{ item.role }}</span>
              <span class="chaoxi-detail-item-status" :class="item.enabled ? 'on' : 'off'">
                <svg v-if="item.enabled" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </span>
            </div>
            <div v-if="detailPrompts.length === 0" class="chaoxi-empty">该预设无可控条目</div>
          </div>
        </template>

        <!-- 正则列表 -->
        <template v-if="detailTab === 'regex'">
          <div class="chaoxi-detail-list chaoxi-regex-list">
            <div v-for="(rx, idx) in detailRegexes" :key="rx.id" class="chaoxi-regex-item">
              <div class="chaoxi-regex-row" @click="toggleRegexExpand(rx.id)">
                <svg class="chaoxi-regex-expand-icon" :class="{ expanded: expandedRegex === rx.id }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                <span class="chaoxi-regex-name" :title="rx.scriptName">{{ rx.scriptName || '(未命名)' }}</span>
                <div class="chaoxi-regex-tags">
                  <span v-if="rx.destDisplay" class="chaoxi-regex-tag">显示</span>
                  <span v-if="rx.destPrompt" class="chaoxi-regex-tag">提示词</span>
                </div>
                <button class="chaoxi-toggle" :class="{ on: rx.enabled }" @click.stop="onToggleRegex(rx.id)"><span class="chaoxi-toggle-knob" /></button>
              </div>
              <div v-if="expandedRegex === rx.id" class="chaoxi-regex-actions">
                <button class="chaoxi-regex-act-btn" @click="onMoveRegex(rx.id, -1)" :disabled="idx === 0" title="上移"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15" /></svg></button>
                <button class="chaoxi-regex-act-btn" @click="onMoveRegex(rx.id, 1)" :disabled="idx === detailRegexes.length - 1" title="下移"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg></button>
              </div>
              <Transition name="chaoxi-editor">
                <div v-if="expandedRegex === rx.id" class="chaoxi-regex-detail">
                  <div class="chaoxi-regex-field">
                    <label>作用范围</label>
                    <div class="chaoxi-regex-source-tags">
                      <span v-if="rx.sourceUserInput" class="chaoxi-regex-stag">用户输入</span>
                      <span v-if="rx.sourceAiOutput" class="chaoxi-regex-stag">AI输出</span>
                      <span v-if="rx.sourceSlashCommand" class="chaoxi-regex-stag">命令</span>
                      <span v-if="rx.sourceWorldInfo" class="chaoxi-regex-stag">世界书</span>
                    </div>
                  </div>
                  <div v-if="rx.minDepth !== null || rx.maxDepth !== null" class="chaoxi-regex-field">
                    <label>深度</label>
                    <span class="chaoxi-regex-depth">{{ rx.minDepth ?? '0' }} - {{ rx.maxDepth ?? '∞' }}</span>
                  </div>
                  <div class="chaoxi-regex-field"><label>查找正则</label><textarea class="chaoxi-regex-code" v-model="regexEditFind" rows="3" spellcheck="false" /></div>
                  <div class="chaoxi-regex-field"><label>替换内容</label><textarea class="chaoxi-regex-code" v-model="regexEditReplace" rows="3" spellcheck="false" /></div>
                  <div class="chaoxi-regex-edit-actions">
                    <button class="chaoxi-regex-save-btn" @click="onSaveRegex(rx.id)">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      保存
                    </button>
                    <button class="chaoxi-regex-cancel-btn" @click="expandedRegex = ''">取消</button>
                  </div>
                </div>
              </Transition>
            </div>
            <div v-if="detailRegexes.length === 0" class="chaoxi-empty">该预设无内置正则</div>
          </div>
        </template>

        <!-- 参数面板 -->
        <template v-if="detailTab === 'params'">
          <div class="chaoxi-detail-list chaoxi-params-list">
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">流式传输</span>
              <button class="chaoxi-toggle" :class="{ on: paramValues.should_stream }" @click="paramValues.should_stream = !paramValues.should_stream">
                <span class="chaoxi-toggle-knob" />
              </button>
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">温度</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.temperature" step="0.05" min="0" max="2" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">Top P</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.top_p" step="0.05" min="0" max="1" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">Top K</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.top_k" step="1" min="0" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">Min P</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.min_p" step="0.01" min="0" max="1" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">频率惩罚</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.frequency_penalty" step="0.05" min="0" max="2" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">存在惩罚</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.presence_penalty" step="0.05" min="0" max="2" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">最大上下文</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.max_context" step="1000" min="1000" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">最大回复 Token</span>
              <input type="number" class="chaoxi-param-input" v-model.number="paramValues.max_completion_tokens" step="100" min="100" />
            </div>
            <div class="chaoxi-param-row">
              <span class="chaoxi-param-label">推理强度</span>
              <select class="chaoxi-param-select" v-model="paramValues.reasoning_effort">
                <option value="auto">auto</option>
                <option value="min">min</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="max">max</option>
              </select>
            </div>
            <div class="chaoxi-param-save-bar">
              <button class="chaoxi-regex-save-btn" @click="onSaveParams">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                保存参数
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 预设右键菜单弹窗 -->
    <Transition name="chaoxi-dialog">
      <div v-if="menuPreset" class="chaoxi-dialog-overlay" @click.self="menuPreset = ''">
        <div class="chaoxi-copy-dialog" style="width:220px;">
          <div class="chaoxi-copy-dialog-header">
            <span>{{ menuPreset }}</span>
            <button class="chaoxi-btn-icon" @click="menuPreset = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div class="chaoxi-copy-dialog-list chaoxi-menu-list">
            <button class="chaoxi-menu-item" @click="onExportPreset(menuPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              导出
            </button>
            <button class="chaoxi-menu-item" @click="onClonePreset(menuPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              克隆
            </button>
            <button class="chaoxi-menu-item" @click="onRenamePresetName(menuPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              重命名
            </button>
            <button class="chaoxi-menu-item" @click="onAssignGroup(menuPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              归组
            </button>
            <button class="chaoxi-menu-item chaoxi-menu-danger" @click="onDeletePresetAction(menuPreset)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 归组弹窗 -->
    <Transition name="chaoxi-dialog">
      <div v-if="showGroupAssign" class="chaoxi-dialog-overlay" @click.self="showGroupAssign = ''">
        <div class="chaoxi-copy-dialog">
          <div class="chaoxi-copy-dialog-header">
            <span>将预设归入分组</span>
            <button class="chaoxi-btn-icon" @click="showGroupAssign = ''"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>
          <div class="chaoxi-copy-dialog-list">
            <label v-for="g in presetGroups" :key="g.id" class="chaoxi-group-assign-item">
              <input type="checkbox" :checked="g.presetNames.includes(showGroupAssign)" @change="onTogglePresetInGroup(g.id, showGroupAssign)" />
              <span>{{ g.name }}</span>
            </label>
            <div v-if="presetGroups.length === 0" class="chaoxi-empty">无分组，请先新建</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 复制目标弹窗 -->
    <Transition name="chaoxi-dialog">
      <div v-if="showCopyTarget" class="chaoxi-dialog-overlay" @click.self="showCopyTarget = false">
        <div class="chaoxi-copy-dialog">
          <div class="chaoxi-copy-dialog-header">
            <span>复制 {{ detailSelectedNames.size }} 个条目到</span>
            <button class="chaoxi-btn-icon" @click="showCopyTarget = false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>
          <div class="chaoxi-copy-dialog-list">
            <button v-for="info in copyTargetPresets" :key="info.name" class="chaoxi-copy-dialog-item" @click="onCopyToPreset(info.name)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              {{ info.name }}
              <span class="chaoxi-copy-dialog-meta">{{ info.promptCount }} 条目</span>
            </button>
            <div v-if="copyTargetPresets.length === 0" class="chaoxi-empty">无可用目标预设</div>
          </div>
        </div>
      </div>
    </Transition>

    <ModalDialog :visible="modal.visible.value" :title="modal.title.value" :message="modal.message.value" :mode="modal.mode.value" :default-value="modal.defaultValue.value" @confirm="modal.onConfirm" @cancel="modal.onCancel" />
  </div>
</template>

<script setup lang="ts">
import {
  type PresetInfo, type PromptItem as PromptItemType, type PresetGroupItem, type RegexItem, type PresetParams,
  getAllPresetInfos, switchPreset, triggerPresetImport, getPresetPrompts, copyPromptsToPreset,
  readPresetGroups, savePresetGroups, readPresetNotes, getPresetNote, setPresetNote,
  getPresetRegexes, togglePresetRegex, movePresetRegex, updatePresetRegex,
  saveCurrentPreset, exportPreset, removePreset, renamePresetName, clonePreset,
  getPresetParams, updatePresetParams,
} from './types';
import ModalDialog from './ModalDialog.vue';
import { useModal } from './useModal';

// 彩蛋：预设识别
const SANMINGYUE_BANNER = 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@cp-v2.1.0/dist/潮汐预设脚本/assets/ig_0bb09a32e9873f06016a43e41ce3708191bcf8e98620765ea5.png';
const IZUMI_AVATAR = 'https://i.postimg.cc/4yWJP6R6/f762f573-f542-4f2f-8303-770f83e248f9.png';
const NEMO_BANNER = 'https://i.postimg.cc/rFSPWVc9/u31sdg.png';
const SANMINGYUE_KEYWORDS = ['潮汐', '明月秋青', '氤', '傻子', '浮生', '观星'];

function isSanmingyuePreset(name: string): boolean {
  const lower = name.toLowerCase();
  return SANMINGYUE_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function isIzumiPreset(name: string): boolean {
  return /izumi/i.test(name);
}

function isNemoPreset(name: string): boolean {
  return /nemo/i.test(name);
}

function getPresetBannerStyle(name: string): Record<string, string> {
  if (isNemoPreset(name)) {
    return {
      backgroundImage: `linear-gradient(to right, rgba(5,8,16,0.9) 0%, rgba(5,8,16,0.5) 50%, rgba(5,8,16,0.15) 100%), url(${NEMO_BANNER})`,
      backgroundSize: 'cover',
      backgroundPosition: 'right top',
      backgroundRepeat: 'no-repeat',
    };
  }
  if (isSanmingyuePreset(name)) {
    return {
      backgroundImage: `linear-gradient(to right, rgba(5,8,16,0.9) 0%, rgba(5,8,16,0.5) 50%, rgba(5,8,16,0.15) 100%), url(${SANMINGYUE_BANNER})`,
      backgroundSize: 'cover',
      backgroundPosition: 'right top',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
}

const props = defineProps<{ isMobile: boolean }>();
const emit = defineEmits<{ 'preset-switched': [] }>();
const modal = useModal();

const presetInfos = ref<PresetInfo[]>([]);
const selectedPreset = ref('');
const detailPrompts = ref<PromptItemType[]>([]);
const detailRegexes = ref<RegexItem[]>([]);
const detailSelectedNames = reactive(new Set<string>());
const showCopyTarget = ref(false);
const showGroupAssign = ref('');
const menuPreset = ref('');
const isSwitching = ref(false);
const detailTab = ref<'prompts' | 'regex' | 'params'>('prompts');

const presetGroups = ref<PresetGroupItem[]>([]);
const activeGroupFilter = ref('__all__');
const presetNotes = ref<Record<string, string>>({});
const editingNote = ref(false);
const noteValue = ref('');
const noteInputRef = ref<HTMLInputElement | null>(null);

const expandedRegex = ref('');
const regexEditFind = ref('');
const regexEditReplace = ref('');

const paramValues = reactive<PresetParams>({
  temperature: 1, top_p: 1, top_k: 0, min_p: 0,
  frequency_penalty: 0, presence_penalty: 0,
  max_context: 128000, max_completion_tokens: 4096,
  should_stream: true, reasoning_effort: 'auto',
});

const filteredPresets = computed(() => {
  if (activeGroupFilter.value === '__all__') return presetInfos.value;
  const group = presetGroups.value.find(g => g.id === activeGroupFilter.value);
  if (!group) return presetInfos.value;
  const nameSet = new Set(group.presetNames);
  return presetInfos.value.filter(p => nameSet.has(p.name));
});
const selectedPresetIsActive = computed(() => presetInfos.value.find(p => p.name === selectedPreset.value)?.isActive ?? false);
const allDetailSelected = computed(() => detailPrompts.value.length > 0 && detailPrompts.value.every(p => detailSelectedNames.has(p.name)));
const someDetailSelected = computed(() => detailPrompts.value.some(p => detailSelectedNames.has(p.name)));
const copyTargetPresets = computed(() => presetInfos.value.filter(p => p.name !== selectedPreset.value));
const currentNote = computed(() => presetNotes.value[selectedPreset.value] ?? '');

function refresh() {
  presetInfos.value = getAllPresetInfos();
  presetGroups.value = readPresetGroups();
  presetNotes.value = readPresetNotes();
  if (selectedPreset.value) {
    detailPrompts.value = getPresetPrompts(selectedPreset.value);
    detailRegexes.value = getPresetRegexes(selectedPreset.value);
    const names = new Set(detailPrompts.value.map(p => p.name));
    for (const n of detailSelectedNames) { if (!names.has(n)) detailSelectedNames.delete(n); }
  }
}
refresh();
const refreshTimer = setInterval(refresh, 5000);
onUnmounted(() => clearInterval(refreshTimer));
defineExpose({ refresh });

function onSelectPreset(name: string) {
  if (selectedPreset.value === name && !props.isMobile) { selectedPreset.value = ''; detailPrompts.value = []; detailRegexes.value = []; detailSelectedNames.clear(); expandedRegex.value = ''; return; }
  selectedPreset.value = name;
  detailPrompts.value = getPresetPrompts(name);
  detailRegexes.value = getPresetRegexes(name);
  detailSelectedNames.clear();
  detailTab.value = 'prompts';
  expandedRegex.value = '';
  editingNote.value = false;
}

async function onSwitchPreset(name: string) {
  if (isSwitching.value) return;
  const ok = await modal.showConfirm('切换预设', `确定要切换到预设「${name}」吗？`);
  if (!ok) return;
  isSwitching.value = true;
  try { const success = await switchPreset(name); if (success) { refresh(); emit('preset-switched'); } }
  catch (e) { console.error('[潮汐预设脚本] 切换预设出错:', e); }
  finally { isSwitching.value = false; }
}

async function onImportPreset() { const result = await triggerPresetImport(); if (result.success) refresh(); }

// 保存当前预设
async function onSaveCurrentPreset() {
  const ok = await modal.showConfirm('保存预设', '将当前修改保存回原始预设？');
  if (!ok) return;
  const success = await saveCurrentPreset();
  if (success) refresh();
}

// 条目选择
function toggleDetailSelect(name: string) { if (detailSelectedNames.has(name)) detailSelectedNames.delete(name); else detailSelectedNames.add(name); }
function toggleDetailSelectAll() { if (allDetailSelected.value) detailPrompts.value.forEach(p => detailSelectedNames.delete(p.name)); else detailPrompts.value.forEach(p => detailSelectedNames.add(p.name)); }

async function onCopyToPreset(targetName: string) {
  const names = [...detailSelectedNames]; if (!names.length) return; showCopyTarget.value = false;
  const ok = await modal.showConfirm('确认复制', `将 ${names.length} 个条目从「${selectedPreset.value}」复制到「${targetName}」？同名条目将被覆盖。`);
  if (!ok) return;
  try { const success = await copyPromptsToPreset(selectedPreset.value, targetName, names); if (success) { detailSelectedNames.clear(); refresh(); } }
  catch (e) { console.error('[潮汐预设脚本] 复制条目出错:', e); }
}

// 预设分组
async function onCreatePresetGroup() { const name = await modal.showPrompt('新建预设分组', '新分组'); if (!name) return; presetGroups.value.push({ id: `pg_${Date.now()}`, name: name as string, presetNames: [] }); savePresetGroups(presetGroups.value); }
async function onDeletePresetGroup(id: string) { const g = presetGroups.value.find(g => g.id === id); if (!g) return; const ok = await modal.showConfirm('删除分组', `确定删除分组「${g.name}」？`); if (!ok) return; presetGroups.value = presetGroups.value.filter(g => g.id !== id); if (activeGroupFilter.value === id) activeGroupFilter.value = '__all__'; savePresetGroups(presetGroups.value); }
async function onRenamePresetGroup(id: string) { const g = presetGroups.value.find(g => g.id === id); if (!g) return; const newName = await modal.showPrompt('重命名分组', g.name); if (!newName || newName === g.name) return; g.name = newName as string; savePresetGroups(presetGroups.value); }
function onTogglePresetInGroup(groupId: string, presetName: string) { const g = presetGroups.value.find(g => g.id === groupId); if (!g) return; const idx = g.presetNames.indexOf(presetName); if (idx >= 0) g.presetNames.splice(idx, 1); else g.presetNames.push(presetName); savePresetGroups(presetGroups.value); }

// 备注
function startEditNote() { noteValue.value = currentNote.value; editingNote.value = true; nextTick(() => noteInputRef.value?.focus()); }
function saveNote() { setPresetNote(selectedPreset.value, noteValue.value); presetNotes.value = readPresetNotes(); editingNote.value = false; }

// 正则
function toggleRegexExpand(id: string) { if (expandedRegex.value === id) { expandedRegex.value = ''; return; } expandedRegex.value = id; const rx = detailRegexes.value.find(r => r.id === id); if (rx) { regexEditFind.value = rx.findRegex; regexEditReplace.value = rx.replaceString; } }
async function onToggleRegex(id: string) { try { await togglePresetRegex(selectedPreset.value, id); detailRegexes.value = getPresetRegexes(selectedPreset.value); } catch (e) { console.error(e); } }
async function onMoveRegex(id: string, direction: -1 | 1) { try { await movePresetRegex(selectedPreset.value, id, direction); detailRegexes.value = getPresetRegexes(selectedPreset.value); } catch (e) { console.error(e); } }
async function onSaveRegex(id: string) { try { await updatePresetRegex(selectedPreset.value, id, { findRegex: regexEditFind.value, replaceString: regexEditReplace.value }); detailRegexes.value = getPresetRegexes(selectedPreset.value); expandedRegex.value = ''; } catch (e) { console.error(e); } }

// 预设菜单操作
function openPresetMenu(name: string, _e: MouseEvent) { menuPreset.value = name; }
function onAssignGroup(name: string) { menuPreset.value = ''; showGroupAssign.value = name; }

async function onExportPreset(name: string) { menuPreset.value = ''; exportPreset(name); }

async function onClonePreset(name: string) {
  menuPreset.value = '';
  const newName = await modal.showPrompt('克隆预设', `${name} (副本)`);
  if (!newName) return;
  const success = await clonePreset(name, newName as string);
  if (success) refresh();
}

async function onRenamePresetName(name: string) {
  menuPreset.value = '';
  // 防呆：禁止重命名当前激活的预设（重命名后保存功能会找不到原始预设）
  const info = presetInfos.value.find(p => p.name === name);
  if (info?.isActive) {
    await modal.showConfirm('无法重命名', '当前正在使用的预设不能重命名。请先切换到其他预设再操作。');
    return;
  }
  const newName = await modal.showPrompt('重命名预设', name);
  if (!newName || newName === name) return;
  const success = await renamePresetName(name, newName as string);
  if (success) { if (selectedPreset.value === name) selectedPreset.value = newName as string; refresh(); }
}

async function onDeletePresetAction(name: string) {
  menuPreset.value = '';
  // 防呆：禁止删除当前激活的预设
  const info = presetInfos.value.find(p => p.name === name);
  if (info?.isActive) {
    await modal.showConfirm('无法删除', '当前正在使用的预设不能删除。请先切换到其他预设再操作。');
    return;
  }
  const ok = await modal.showConfirm('删除预设', `确定要永久删除预设「${name}」吗？此操作不可撤销。`);
  if (!ok) return;
  const success = await removePreset(name);
  if (success) { if (selectedPreset.value === name) { selectedPreset.value = ''; detailPrompts.value = []; detailRegexes.value = []; } refresh(); }
}

// 参数
function loadParams() {
  if (!selectedPreset.value) return;
  try {
    const p = getPresetParams(selectedPreset.value);
    Object.assign(paramValues, p);
  } catch (e) { console.error(e); }
}

async function onSaveParams() {
  // 防呆：数值校验
  const clamp = (v: number, min: number, max: number) => {
    if (typeof v !== 'number' || isNaN(v)) return min;
    return Math.max(min, Math.min(max, v));
  };
  const validated: PresetParams = {
    temperature: clamp(paramValues.temperature, 0, 2),
    top_p: clamp(paramValues.top_p, 0, 1),
    top_k: Math.max(0, Math.round(paramValues.top_k || 0)),
    min_p: clamp(paramValues.min_p, 0, 1),
    frequency_penalty: clamp(paramValues.frequency_penalty, 0, 2),
    presence_penalty: clamp(paramValues.presence_penalty, 0, 2),
    max_context: Math.max(1000, Math.round(paramValues.max_context || 128000)),
    max_completion_tokens: Math.max(100, Math.round(paramValues.max_completion_tokens || 4096)),
    should_stream: !!paramValues.should_stream,
    reasoning_effort: paramValues.reasoning_effort || 'auto',
  };
  Object.assign(paramValues, validated);
  try {
    await updatePresetParams(selectedPreset.value, validated);
    refresh();
  } catch (e) { console.error('[潮汐预设脚本] 保存参数失败:', e); }
}
</script>

<style scoped>
.chaoxi-manager-view { display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;position:relative; }
.chaoxi-manager-toolbar { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(77,201,246,.1);background:rgba(5,8,16,.4);flex-shrink:0;gap:8px; }
.chaoxi-manager-toolbar-left { display:flex;align-items:center;gap:8px; }
.chaoxi-manager-label { font-size:12px;font-weight:600;color:rgba(255,255,255,.6); }
.chaoxi-manager-count { font-size:11px;color:rgba(255,255,255,.3); }
.chaoxi-manager-toolbar-right { display:flex;gap:6px; }
.chaoxi-manager-btn { display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1px solid rgba(77,201,246,.15);background:rgba(77,201,246,.04);color:rgba(255,255,255,.5);font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap; }
.chaoxi-manager-btn:hover { background:rgba(77,201,246,.15);color:#4dc9f6;border-color:rgba(77,201,246,.3); }
.chaoxi-btn-switch { border-color:rgba(52,211,153,.2);background:rgba(52,211,153,.06); }
.chaoxi-btn-switch:hover { background:rgba(52,211,153,.18);color:#34d399;border-color:rgba(52,211,153,.4); }
.chaoxi-btn-save-preset { border-color:rgba(251,191,36,.2);background:rgba(251,191,36,.06); }
.chaoxi-btn-save-preset:hover { background:rgba(251,191,36,.18);color:#fbbf24;border-color:rgba(251,191,36,.4); }
.chaoxi-group-tabs { display:flex;flex-wrap:wrap;gap:4px;padding:6px 10px;border-bottom:1px solid rgba(77,201,246,.08);background:rgba(5,8,16,.3);flex-shrink:0; }
.chaoxi-group-tab { display:inline-flex;align-items:center;gap:4px;padding:3px 10px;font-size:11px;color:rgba(255,255,255,.4);background:transparent;border:1px solid rgba(255,255,255,.06);border-radius:4px;cursor:pointer;transition:all .15s;white-space:nowrap; }
.chaoxi-group-tab:hover { color:rgba(255,255,255,.7);background:rgba(77,201,246,.04); }
.chaoxi-group-tab.active { color:#4dc9f6;background:rgba(77,201,246,.1);border-color:rgba(77,201,246,.2); }
.chaoxi-group-tab-add { border-style:dashed;color:rgba(255,255,255,.25); }
.chaoxi-group-tab-add:hover { color:#4dc9f6;border-color:rgba(77,201,246,.3); }
.chaoxi-group-tab-del { opacity:0;transition:opacity .15s;cursor:pointer;display:inline-flex;align-items:center;color:rgba(255,255,255,.3); }
.chaoxi-group-tab:hover .chaoxi-group-tab-del { opacity:1; }
.chaoxi-group-tab-del:hover { color:#f87171; }
.chaoxi-manager-body { flex:1;display:flex;min-height:0;overflow:hidden; }
.mobile .chaoxi-manager-body { flex-direction:column; }
.chaoxi-preset-list { flex:1;overflow-y:auto;overflow-x:hidden;padding:6px;min-width:0; }
.chaoxi-preset-list::-webkit-scrollbar { width:3px; }
.chaoxi-preset-list::-webkit-scrollbar-thumb { background:rgba(77,201,246,.12);border-radius:2px; }
.chaoxi-manager-body.has-detail:not(.mobile *) .chaoxi-preset-list { flex:0 0 260px;border-right:1px solid rgba(77,201,246,.1); }
.mobile .chaoxi-preset-list.collapsed { display:none; }
.chaoxi-preset-card { display:flex;align-items:center;padding:7px 8px;margin-bottom:2px;border-radius:8px;border:1px solid transparent;cursor:pointer;transition:all .15s;gap:4px; }
.chaoxi-preset-card:hover { background:rgba(77,201,246,.04);border-color:rgba(77,201,246,.08); }
.chaoxi-preset-card.selected { background:rgba(77,201,246,.08);border-color:rgba(77,201,246,.15); }
.chaoxi-preset-card.active { border-color:rgba(52,211,153,.15); }
.chaoxi-preset-card.active.selected { background:rgba(52,211,153,.06);border-color:rgba(52,211,153,.2); }
.chaoxi-preset-card-main { display:flex;align-items:center;gap:8px;flex:1;min-width:0; }
.chaoxi-preset-card-icon { color:rgba(255,255,255,.25);flex-shrink:0; }
.chaoxi-preset-card.active .chaoxi-preset-card-icon { color:rgba(52,211,153,.5); }
.chaoxi-preset-card-info { flex:1;min-width:0;display:flex;flex-direction:column;gap:1px; }
.chaoxi-preset-card-name { font-size:12px;font-weight:500;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.chaoxi-preset-card-meta { font-size:10px;color:rgba(255,255,255,.3); }
.chaoxi-preset-card-note { font-size:10px;color:rgba(77,201,246,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.chaoxi-preset-card-badges { display:flex;gap:4px;flex-shrink:0; }
.chaoxi-badge { display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:999px;font-size:10px;font-weight:500; }
.chaoxi-badge-active { background:rgba(52,211,153,.12);color:#34d399; }
.chaoxi-preset-card-actions { display:flex;gap:3px;flex-shrink:0;opacity:0;transition:opacity .15s; }
.chaoxi-preset-card:hover .chaoxi-preset-card-actions { opacity:1; }
.chaoxi-preset-action-btn { display:inline-flex;align-items:center;gap:2px;padding:3px 6px;border-radius:4px;border:1px solid rgba(52,211,153,.2);background:rgba(52,211,153,.06);color:rgba(52,211,153,.7);font-size:10px;cursor:pointer;transition:all .15s; }
.chaoxi-preset-action-btn:hover { background:rgba(52,211,153,.15);color:#34d399; }
.chaoxi-action-more { border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.4); }
.chaoxi-action-more:hover { background:rgba(255,255,255,.08);color:rgba(255,255,255,.7); }
.chaoxi-preset-detail { flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden; }
.chaoxi-detail-header { display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid rgba(77,201,246,.1);background:rgba(5,8,16,.3);flex-shrink:0; }
.chaoxi-detail-back { display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:none;border-radius:4px;background:transparent;color:rgba(255,255,255,.5);font-size:12px;cursor:pointer;flex-shrink:0; }
.chaoxi-detail-back:hover { color:#4dc9f6;background:rgba(77,201,246,.08); }
.chaoxi-detail-title { flex:1;font-size:13px;font-weight:600;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.chaoxi-detail-actions-top { flex-shrink:0; }
.chaoxi-note-bar { display:flex;align-items:center;gap:6px;padding:5px 12px;border-bottom:1px solid rgba(77,201,246,.06);flex-shrink:0;min-height:30px; }
.chaoxi-note-text { flex:1;font-size:11px;color:rgba(255,255,255,.45);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer; }
.chaoxi-note-text.empty { color:rgba(255,255,255,.2);font-style:italic; }
.chaoxi-note-edit-btn,.chaoxi-note-save-btn { width:22px;height:22px;border:none;border-radius:4px;background:transparent;color:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;padding:0; }
.chaoxi-note-edit-btn:hover { color:#4dc9f6;background:rgba(77,201,246,.08); }
.chaoxi-note-save-btn { color:rgba(52,211,153,.6); }
.chaoxi-note-save-btn:hover { color:#34d399;background:rgba(52,211,153,.1); }
.chaoxi-note-input { flex:1;background:rgba(5,8,16,.6);border:1px solid rgba(77,201,246,.2);border-radius:4px;color:rgba(255,255,255,.8);font-size:11px;padding:3px 8px;outline:none;min-width:0; }
.chaoxi-note-input:focus { border-color:#4dc9f6; }
.chaoxi-detail-tabs { display:flex;border-bottom:1px solid rgba(77,201,246,.08);flex-shrink:0; }
.chaoxi-detail-tab { flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:6px 0;font-size:11px;font-weight:500;color:rgba(255,255,255,.35);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all .15s; }
.chaoxi-detail-tab:hover { color:rgba(255,255,255,.6);background:rgba(77,201,246,.03); }
.chaoxi-detail-tab.active { color:#4dc9f6;border-bottom-color:#4dc9f6;background:rgba(77,201,246,.06); }
.chaoxi-detail-toolbar { display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-bottom:1px solid rgba(77,201,246,.06);flex-shrink:0;gap:8px;flex-wrap:wrap; }
.chaoxi-detail-toolbar-left { display:flex;align-items:center;gap:8px; }
.chaoxi-detail-toolbar-right { display:flex;gap:4px; }
.chaoxi-detail-sel-info { font-size:11px;color:rgba(255,255,255,.4); }
.chaoxi-checkbox { width:14px;height:14px;accent-color:#4dc9f6;cursor:pointer;flex-shrink:0; }
.chaoxi-detail-list { flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 8px; }
.chaoxi-detail-list::-webkit-scrollbar { width:3px; }
.chaoxi-detail-list::-webkit-scrollbar-thumb { background:rgba(77,201,246,.12);border-radius:2px; }
.chaoxi-detail-item { display:flex;align-items:center;gap:6px;padding:5px 6px;border-bottom:1px solid rgba(77,201,246,.04);transition:background .1s; }
.chaoxi-detail-item:last-child { border-bottom:none; }
.chaoxi-detail-item:hover { background:rgba(77,201,246,.03); }
.chaoxi-detail-item.selected { background:rgba(77,201,246,.06); }
.chaoxi-detail-item-name { flex:1;font-size:12px;color:rgba(255,255,255,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0; }
.chaoxi-detail-item-status { flex-shrink:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center; }
.chaoxi-detail-item-status.on { color:rgba(52,211,153,.6); }
.chaoxi-detail-item-status.off { color:rgba(255,255,255,.15); }
.chaoxi-role-tag { font-size:9px;padding:1px 5px;border-radius:3px;flex-shrink:0;font-weight:500;text-transform:uppercase;letter-spacing:.3px; }
.chaoxi-role-system { background:rgba(77,201,246,.08);color:rgba(77,201,246,.6); }
.chaoxi-role-user { background:rgba(52,211,153,.08);color:rgba(52,211,153,.6); }
.chaoxi-role-assistant { background:rgba(251,191,36,.08);color:rgba(251,191,36,.6); }
.chaoxi-regex-item { border-bottom:1px solid rgba(77,201,246,.04); }
.chaoxi-regex-item:last-child { border-bottom:none; }
.chaoxi-regex-row { display:flex;align-items:center;gap:6px;padding:6px 6px;cursor:pointer;transition:background .1s; }
.chaoxi-regex-row:hover { background:rgba(77,201,246,.03); }
.chaoxi-regex-expand-icon { flex-shrink:0;transition:transform .2s;color:rgba(255,255,255,.3); }
.chaoxi-regex-expand-icon.expanded { transform:rotate(90deg); }
.chaoxi-regex-name { flex:1;font-size:12px;color:rgba(255,255,255,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0; }
.chaoxi-regex-tags { display:flex;gap:3px;flex-shrink:0; }
.chaoxi-regex-tag { font-size:9px;padding:1px 4px;border-radius:3px;background:rgba(251,191,36,.08);color:rgba(251,191,36,.5); }
.chaoxi-toggle { position:relative;width:32px;height:18px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);cursor:pointer;flex-shrink:0;padding:0;transition:all .2s; }
.chaoxi-toggle.on { background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3); }
.chaoxi-toggle-knob { position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.25);transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.3); }
.chaoxi-toggle.on .chaoxi-toggle-knob { left:16px;background:#34d399;box-shadow:0 0 6px rgba(52,211,153,.4); }
.chaoxi-regex-actions { display:flex;gap:4px;padding:2px 6px 4px 22px; }
.chaoxi-regex-act-btn { width:22px;height:22px;border:1px solid rgba(77,201,246,.15);border-radius:4px;background:rgba(77,201,246,.04);color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;padding:0; }
.chaoxi-regex-act-btn:hover:not(:disabled) { background:rgba(77,201,246,.15);color:#4dc9f6; }
.chaoxi-regex-act-btn:disabled { opacity:.2;cursor:not-allowed; }
.chaoxi-regex-detail { padding:6px 8px 10px 22px; }
.chaoxi-regex-field { margin-bottom:8px; }
.chaoxi-regex-field label { display:block;font-size:10px;color:rgba(255,255,255,.3);margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px; }
.chaoxi-regex-source-tags { display:flex;flex-wrap:wrap;gap:4px; }
.chaoxi-regex-stag { font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(77,201,246,.08);color:rgba(77,201,246,.55); }
.chaoxi-regex-depth { font-size:11px;color:rgba(255,255,255,.5); }
.chaoxi-regex-code { width:100%;min-height:50px;max-height:200px;padding:6px 8px;border-radius:4px;border:1px solid rgba(77,201,246,.12);background:rgba(5,8,16,.6);color:rgba(255,255,255,.8);font-size:11px;font-family:'Cascadia Code','Fira Code','Consolas',monospace;line-height:1.5;resize:vertical;outline:none;box-sizing:border-box; }
.chaoxi-regex-code:focus { border-color:#4dc9f6;box-shadow:0 0 0 2px rgba(77,201,246,.1); }
.chaoxi-regex-edit-actions { display:flex;gap:6px;justify-content:flex-end; }
.chaoxi-regex-save-btn { display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:5px;border:1px solid rgba(52,211,153,.3);background:rgba(52,211,153,.1);color:#34d399;font-size:11px;cursor:pointer;transition:all .15s; }
.chaoxi-regex-save-btn:hover { background:rgba(52,211,153,.2); }
.chaoxi-regex-cancel-btn { padding:4px 12px;border-radius:5px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);font-size:11px;cursor:pointer;transition:all .15s; }
.chaoxi-regex-cancel-btn:hover { background:rgba(255,255,255,.08);color:rgba(255,255,255,.8); }
/* 参数面板 */
.chaoxi-params-list { padding:8px 12px; }
.chaoxi-param-row { display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(77,201,246,.04); }
.chaoxi-param-row:last-child { border-bottom:none; }
.chaoxi-param-label { font-size:12px;color:rgba(255,255,255,.6);flex-shrink:0; }
.chaoxi-param-input { width:100px;padding:3px 8px;border-radius:4px;border:1px solid rgba(77,201,246,.15);background:rgba(5,8,16,.6);color:rgba(255,255,255,.8);font-size:12px;outline:none;text-align:right; }
.chaoxi-param-input:focus { border-color:#4dc9f6; }
.chaoxi-param-select { width:100px;padding:3px 8px;border-radius:4px;border:1px solid rgba(77,201,246,.15);background:rgba(5,8,16,.6);color:rgba(255,255,255,.8);font-size:12px;outline:none; }
.chaoxi-param-select:focus { border-color:#4dc9f6; }
.chaoxi-param-save-bar { display:flex;justify-content:flex-end;padding:10px 0 4px; }
/* 菜单 */
.chaoxi-menu-list { padding:4px; }
.chaoxi-menu-item { display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:none;border-radius:5px;background:transparent;color:rgba(255,255,255,.6);font-size:12px;text-align:left;cursor:pointer;transition:all .1s; }
.chaoxi-menu-item:hover { background:rgba(77,201,246,.08);color:#4dc9f6; }
.chaoxi-menu-danger:hover { background:rgba(248,113,113,.1);color:#f87171; }
/* 弹窗 */
.chaoxi-dialog-overlay { position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:10; }
.chaoxi-copy-dialog { width:300px;max-height:60%;background:#050810;border:1px solid rgba(77,201,246,.15);border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.5); }
.chaoxi-copy-dialog-header { display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(77,201,246,.1);font-size:13px;font-weight:600;color:rgba(255,255,255,.88); }
.chaoxi-btn-icon { width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s; }
.chaoxi-btn-icon:hover { background:rgba(77,201,246,.15);color:#4dc9f6; }
.chaoxi-copy-dialog-list { flex:1;overflow-y:auto;padding:6px; }
.chaoxi-copy-dialog-item { display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;border-radius:6px;background:transparent;color:rgba(255,255,255,.6);font-size:12px;text-align:left;cursor:pointer;transition:all .15s; }
.chaoxi-copy-dialog-item:hover { background:rgba(77,201,246,.08);color:#4dc9f6; }
.chaoxi-copy-dialog-meta { margin-left:auto;font-size:10px;color:rgba(255,255,255,.25); }
.chaoxi-group-assign-item { display:flex;align-items:center;gap:8px;padding:6px 10px;font-size:12px;color:rgba(255,255,255,.6);cursor:pointer;border-radius:4px;transition:background .1s; }
.chaoxi-group-assign-item:hover { background:rgba(77,201,246,.06); }
.chaoxi-group-assign-item input { accent-color:#4dc9f6;width:14px;height:14px; }
.chaoxi-empty { text-align:center;color:rgba(255,255,255,.3);font-size:13px;padding:30px 16px; }
.chaoxi-dialog-enter-active,.chaoxi-dialog-leave-active { transition:opacity .2s ease; }
.chaoxi-dialog-enter-from,.chaoxi-dialog-leave-to { opacity:0; }
.chaoxi-editor-enter-active,.chaoxi-editor-leave-active { transition:all .2s ease;overflow:hidden; }
.chaoxi-editor-enter-from,.chaoxi-editor-leave-to { opacity:0;max-height:0; }
.chaoxi-editor-enter-to,.chaoxi-editor-leave-from { max-height:600px; }
/* 彩蛋：横幅背景 */
.chaoxi-preset-card.has-banner { border-color:rgba(251,191,36,.2); }
.chaoxi-preset-card.has-banner:hover { border-color:rgba(251,191,36,.35); }
.chaoxi-preset-card.has-banner .chaoxi-preset-card-name { color:rgba(255,255,255,.95);text-shadow:0 1px 4px rgba(0,0,0,.5); }
.chaoxi-preset-card.has-banner .chaoxi-preset-card-meta { color:rgba(255,255,255,.5); }
.chaoxi-detail-header.has-banner { border-bottom-color:rgba(251,191,36,.2); }
.chaoxi-detail-header.has-banner .chaoxi-detail-title { color:rgba(255,255,255,.95);text-shadow:0 1px 4px rgba(0,0,0,.5); }
.chaoxi-detail-header.has-banner .chaoxi-detail-actions-top .chaoxi-manager-btn { background:rgba(5,8,16,.7);border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.8);text-shadow:0 1px 2px rgba(0,0,0,.5); }
.chaoxi-detail-header.has-banner .chaoxi-detail-actions-top .chaoxi-manager-btn:hover { background:rgba(5,8,16,.85);color:#fff; }
.chaoxi-detail-header.has-banner .chaoxi-detail-back { background:rgba(5,8,16,.6);color:rgba(255,255,255,.8); }
/* 彩蛋：izumi头像 */
.chaoxi-izumi-avatar { width:18px;height:18px;border-radius:50%;vertical-align:middle;margin-left:6px;border:1px solid rgba(77,201,246,.3);box-shadow:0 0 6px rgba(77,201,246,.2);object-fit:cover; }
</style>
