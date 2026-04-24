<template>
  <div class="ce-root">
    <!-- 折叠态：悬浮按钮 -->
    <Transition name="fab">
      <button
        v-if="!isOpen"
        ref="fabRef"
        class="ce-fab"
        :class="{ 'is-dragging': isDragging, 'is-snapped': isMobile && !isDragging && !justOpened }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
        title="变量修改器"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e0a040" stroke-width="2" stroke-linecap="round">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </Transition>

    <!-- 手机端：半透明遮罩层 -->
    <Transition name="overlay">
      <div v-if="isOpen && isMobile" class="drawer-overlay" @click="isOpen = false"></div>
    </Transition>

    <!-- 展开态：面板 -->
    <Transition :name="isMobile ? 'drawer' : 'panel'">
      <div v-if="isOpen" class="ce-panel" :class="{ 'is-drawer': isMobile }" :style="panelStyle">
        <!-- 手机端：拖拽把手 -->
        <div v-if="isMobile" class="drawer-handle" @pointerdown="onDrawerPointerDown">
          <div class="handle-bar"></div>
        </div>
        <!-- 顶栏 -->
        <div
          class="ce-topbar"
          :class="{ 'is-dragging': isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <div class="topbar-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e0a040" stroke-width="2" stroke-linecap="round">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span class="topbar-title">修仙CE · 变量修改器</span>
          </div>
          <div class="topbar-actions">
            <button class="topbar-btn" @click="showHelp = !showHelp" @pointerdown.stop title="使用教程">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <button class="topbar-btn close-btn" @click="isOpen = false" @pointerdown.stop>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 楼层选择栏 -->
        <div class="floor-bar">
          <span class="floor-label">目标楼层：</span>
          <button class="floor-btn" :class="{ active: targetFloor === 'latest' }" @click="targetFloor = 'latest'; loadData()">
            最新楼层
          </button>
          <div class="floor-input-wrap">
            <input
              v-model.number="customFloor"
              type="number"
              min="0"
              class="floor-input"
              placeholder="楼层号"
              @keyup.enter="targetFloor = 'custom'; loadData()"
            />
            <button class="floor-go-btn" @click="targetFloor = 'custom'; loadData()">GO</button>
          </div>
          <span class="floor-info">当前: #{{ currentMessageId }}</span>
        </div>

        <!-- 帮助面板 -->
        <Transition name="slide">
          <div v-if="showHelp" class="help-panel">
            <div class="help-content">
              <h3>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -3px; margin-right: 6px;">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                使用教程
              </h3>
              <div class="help-section">
                <h4>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 4px;">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  基本操作
                </h4>
                <ul>
                  <li><b>选择楼层</b>：默认修改最新楼层变量。可输入楼层号修改指定楼层。</li>
                  <li><b>修改变量</b>：在各模块中直接编辑输入框内容，修改会即时生效。</li>
                  <li><b>保存</b>：修改后点击底部「保存修改」按钮写入变量。</li>
                </ul>
              </div>
              <div class="help-section">
                <h4>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 4px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  格式说明
                </h4>
                <ul>
                  <li><b>文本字段</b>：直接输入文字即可。</li>
                  <li><b>数字字段</b>：输入数字，负数和小数会被自动修正。</li>
                  <li><b>术法格式</b>：每行一个，格式为「术法名 | 境界」，如「御剑术 | 小成」。</li>
                  <li><b>关系列表</b>：每行一个，格式为「角色名 | 关系描述」。</li>
                  <li><b>储物戒</b>：按分类拆分为独立变量（如储物戒_丹药、储物戒_药材），每个分类中格式为 <code>物品名 | 数量</code>，每行一个。</li>
                  <li><b>清空字段</b>：将内容清空即可删除该变量值。</li>
                </ul>
              </div>
              <div class="help-section">
                <h4>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 4px;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  注意事项
                </h4>
                <ul>
                  <li>以 <code>_</code> 开头的变量由前端控制，修改需谨慎。</li>
                  <li>以 <code>$</code> 开头的变量对AI不可见，仅脚本使用。</li>
                  <li>修改后需点击「保存修改」才会实际写入。</li>
                  <li>建议一次只修改需要纠错的部分，避免大量改动。</li>
                </ul>
              </div>
              <button class="help-close-btn" @click="showHelp = false">我知道了</button>
            </div>
          </div>
        </Transition>

        <!-- 导航栏 -->
        <div class="nav-bar">
          <button
            v-for="nav in navItems"
            :key="nav.key"
            class="nav-btn"
            :class="{ active: activeNav === nav.key }"
            @click="activeNav = nav.key"
          >
            <span class="nav-icon" v-html="nav.icon"></span>
            <span class="nav-label">{{ nav.label }}</span>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="ce-body">
          <!-- 位置与时间 -->
          <div v-if="activeNav === 'location'" class="edit-section">
            <SectionTitle icon="map-pin">位置信息</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.大区域" label="大区域" hint="如：中央神州、东荒妖域" />
              <FieldInput v-model="data.子区域" label="子区域" hint="如：丹霞灵原、万剑山脉" />
              <FieldInput v-model="data.具体地点" label="具体地点" hint="如：常春城·百草集" />
              <FieldInput v-model="data.在场角色" label="在场角色" hint="当前场景中出现的角色" />
            </div>

            <SectionTitle icon="clock">时间系统</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.阴阳历" label="阴阳历" hint="如：阳历三百二十年" />
              <FieldSelect v-model="data.时辰" label="时辰" :options="时辰选项" />
            </div>
          </div>

          <!-- 身份信息 -->
          <div v-if="activeNav === 'identity'" class="edit-section">
            <SectionTitle icon="user">身份信息</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.灵根" label="灵根" hint="如：天灵根(火)、变异灵根(雷火)" />
              <FieldInput v-model="data.道途" label="道途" hint="正道 / 邪道 / 魔道 / 中立" />
              <FieldInput v-model="data.所属势力" label="所属势力" hint="如：青云宗、散修" />
              <FieldInput v-model="data.宗门地位" label="宗门地位" hint="如：外门弟子、内门长老" />
            </div>

            <SectionTitle icon="mountain">境界</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.当前境界" label="当前境界" hint="如：金丹期前期、元婴期大圆满" />
            </div>

            <SectionTitle icon="heart">寿元</SectionTitle>
            <div class="field-group">
              <FieldNumber v-model="data.当前年纪" label="当前年纪" hint="当前年龄" />
              <FieldNumber v-model="data.当前寿元" label="当前寿元" hint="总寿元上限" />
              <FieldNumber v-model="data._剩余寿元" label="_剩余寿元" hint="由脚本自动计算，可手动覆盖" warn />
              <FieldInput v-model="data._寿元状态" label="_寿元状态" hint="正常/衰老初期/灵力枯竭/油尽灯枯" warn />
              <FieldInput v-model="data._轮回状态" label="_轮回状态" hint="正常/轮回中" warn />
            </div>
          </div>

          <!-- 功法系统 -->
          <div v-if="activeNav === 'gongfa'" class="edit-section">
            <SectionTitle icon="sword">主修功法</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.主修功法" label="主修功法" hint="功法名称" />
              <FieldInput v-model="data.功法品级" label="功法品级" hint="如：天阶上品、地阶下品" />
              <FieldNumber v-model="data.功法总层数" label="功法总层数" hint="功法共几层" />
              <FieldNumber v-model="data.功法已修层数" label="功法已修层数" hint="已修到第几层" />
            </div>

            <SectionTitle icon="scroll">习得术法</SectionTitle>
            <div class="help-inline">每行一个，格式：<code>术法名 | 境界</code>（如：御剑术 | 大成）</div>
            <textarea
              class="ce-textarea"
              :value="formatSkills(data.习得术法)"
              @input="parseSkills(($event.target as HTMLTextAreaElement).value)"
              placeholder="御剑术 | 大成&#10;火球术 | 入门&#10;缩地成寸 | 小成"
              rows="5"
            ></textarea>

            <SectionTitle icon="book">功法库</SectionTitle>
            <div class="help-inline">格式：<code>功法名|品级|已修层/总层</code>，分号分隔</div>
            <FieldInput v-model="data.$功法库" label="$功法库" hint="如：太虚剑经|天阶|3/9;五行诀|地阶|1/5" />

            <SectionTitle icon="flame">剑心·丹道·异火</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.剑心境界" label="剑心境界" hint="如：剑心初成、剑心通明" />
              <FieldInput v-model="data.丹道境界" label="丹道境界" hint="如：炼精化气、凝丹成形" />
              <FieldInput v-model="data.异火列表" label="异火列表" hint="拥有的异火，用|分隔" />
            </div>
          </div>

          <!-- 物品与灵石 -->
          <div v-if="activeNav === 'items'" class="edit-section">
            <SectionTitle icon="gem">灵石</SectionTitle>
            <div class="field-group">
              <FieldNumber v-model="data.下品灵石" label="下品灵石" hint="数量" />
              <FieldNumber v-model="data.中品灵石" label="中品灵石" hint="数量" />
              <FieldNumber v-model="data.上品灵石" label="上品灵石" hint="数量" />
              <FieldNumber v-model="data.极品灵石" label="极品灵石" hint="数量" />
              <FieldInput v-model="data.凡俗货币" label="凡俗货币" hint="如：纹银三十两" />
            </div>

            <SectionTitle icon="box">储物戒</SectionTitle>
            <div class="help-inline">按分类拆分为独立变量，每行格式：<code>物品名 | 数量</code></div>
            <div v-for="cat in storageCategoryList" :key="cat.key" class="storage-cat-section">
              <div class="storage-cat-title">{{ cat.label }}</div>
              <textarea
                class="ce-textarea"
                :value="formatCategoryItems(cat.key)"
                @input="parseCategoryItems(cat.key, ($event.target as HTMLTextAreaElement).value)"
                :placeholder="cat.placeholder"
                rows="3"
              ></textarea>
            </div>

            <SectionTitle icon="shield">装备</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data._装备_武器" label="_装备·武器" hint="当前装备的武器" warn />
              <FieldInput v-model="data._装备_防具" label="_装备·防具" hint="当前装备的防具" warn />
              <FieldInput v-model="data._装备_饰品" label="_装备·饰品" hint="当前装备的饰品" warn />
            </div>
            <div class="field-group">
              <FieldInput v-model="data.未装备_武器" label="未装备·武器" hint="背包中的武器，顿号分隔" />
              <FieldInput v-model="data.未装备_防具" label="未装备·防具" hint="背包中的防具，顿号分隔" />
              <FieldInput v-model="data.未装备_饰品" label="未装备·饰品" hint="背包中的饰品，顿号分隔" />
            </div>
          </div>

          <!-- 关系列表 -->
          <div v-if="activeNav === 'relations'" class="edit-section">
            <SectionTitle icon="users">关系列表</SectionTitle>
            <div class="help-inline">每行一个，格式：<code>角色名 | 关系描述</code></div>
            <div class="help-inline">关系描述格式：<code>性别|修为|所属|关系态度|重要事件1;事件2</code></div>
            <textarea
              class="ce-textarea"
              :value="formatRelations(data.关系列表)"
              @input="parseRelations(($event.target as HTMLTextAreaElement).value)"
              placeholder="云溪 | 女|金丹期|青云宗|同门师姐·亲近|初入宗门时引荐&#10;赤焰老祖 | 男|化神期|魔道|宗门敌人|杀害师父"
              rows="6"
            ></textarea>
          </div>

          <!-- 百艺系统 -->
          <div v-if="activeNav === 'arts'" class="edit-section">
            <SectionTitle icon="palette">百艺境界</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.炼器境界" label="炼器境界" hint="如：锻器入门、器道小成" />
              <FieldInput v-model="data.阵法境界" label="阵法境界" hint="如：阵道入门" />
              <FieldInput v-model="data.符箓境界" label="符箓境界" hint="如：符道入门" />
              <FieldInput v-model="data.驭兽境界" label="驭兽境界" hint="如：驭兽入门" />
              <FieldInput v-model="data.医术境界" label="医术境界" hint="如：医道入门" />
              <FieldInput v-model="data.傀儡术境界" label="傀儡术境界" hint="如：傀儡入门" />
              <FieldInput v-model="data.种植采药境界" label="种植采药境界" hint="如：草药入门" />
            </div>

            <SectionTitle icon="wrench">百艺装备</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.装备_丹炉" label="装备·丹炉" hint="丹炉名称" />
              <FieldInput v-model="data.装备_锻造台" label="装备·锻造台" hint="锻造台名称" />
              <FieldInput v-model="data.装备_符笔" label="装备·符笔" hint="符笔名称" />
              <FieldInput v-model="data.装备_阵盘" label="装备·阵盘" hint="阵盘名称" />
              <FieldInput v-model="data.装备_药箱" label="装备·药箱" hint="药箱名称" />
              <FieldInput v-model="data.装备_一寸地" label="装备·一寸地" hint="灵田名称" />
              <FieldInput v-model="data.装备_傀儡" label="装备·傀儡" hint="傀儡名称" />
              <FieldInput v-model="data.装备_灵兽" label="装备·灵兽" hint="灵兽名称" />
            </div>

            <SectionTitle icon="bar-chart">百艺熟练度/经验值</SectionTitle>
            <div class="help-inline">熟练度：累计值，无上限。经验值：0~100，满100时升境界</div>
            <div class="field-group compact">
              <FieldNumber v-model="data.$炼丹_熟练度" label="炼丹·熟练度" />
              <FieldNumber v-model="data.$炼丹_经验值" label="炼丹·经验值" hint="0~100" />
              <FieldNumber v-model="data.$炼器_熟练度" label="炼器·熟练度" />
              <FieldNumber v-model="data.$炼器_经验值" label="炼器·经验值" hint="0~100" />
              <FieldNumber v-model="data.$阵法_熟练度" label="阵法·熟练度" />
              <FieldNumber v-model="data.$阵法_经验值" label="阵法·经验值" hint="0~100" />
              <FieldNumber v-model="data.$符箓_熟练度" label="符箓·熟练度" />
              <FieldNumber v-model="data.$符箓_经验值" label="符箓·经验值" hint="0~100" />
              <FieldNumber v-model="data.$驭兽_熟练度" label="驭兽·熟练度" />
              <FieldNumber v-model="data.$驭兽_经验值" label="驭兽·经验值" hint="0~100" />
              <FieldNumber v-model="data.$医术_熟练度" label="医术·熟练度" />
              <FieldNumber v-model="data.$医术_经验值" label="医术·经验值" hint="0~100" />
              <FieldNumber v-model="data.$傀儡术_熟练度" label="傀儡术·熟练度" />
              <FieldNumber v-model="data.$傀儡术_经验值" label="傀儡术·经验值" hint="0~100" />
              <FieldNumber v-model="data.$种植采药_熟练度" label="种植采药·熟练度" />
              <FieldNumber v-model="data.$种植采药_经验值" label="种植采药·经验值" hint="0~100" />
            </div>

            <SectionTitle icon="list">百艺附属数据</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.$阵盘_存放阵法" label="$阵盘·存放阵法" hint="阵盘中储存的阵法" />
              <FieldInput v-model="data.$傀儡状态列表" label="$傀儡状态列表" hint="傀儡的状态描述" />
              <FieldInput v-model="data.$灵兽状态列表" label="$灵兽状态列表" hint="灵兽的状态描述" />
              <FieldInput v-model="data.$一寸地_种植列表" label="$一寸地·种植列表" hint="灵田种植情况" />
              <FieldInput v-model="data.$药箱_工具" label="$药箱·工具" hint="药箱中的工具" />
            </div>
          </div>

          <!-- 钓鱼系统 -->
          <div v-if="activeNav === 'fishing'" class="edit-section">
            <SectionTitle icon="anchor">钓鱼系统</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.装备_鱼竿" label="装备·鱼竿" hint="鱼竿名称" />
              <FieldInput v-model="data.装备_渔网" label="装备·渔网" hint="渔网名称" />
              <FieldInput v-model="data.装备_钓箱" label="装备·钓箱" hint="钓箱名称" />
              <FieldNumber v-model="data._钓鱼_钓鱼次数" label="_钓鱼次数" hint="总钓鱼次数" warn />
              <FieldNumber v-model="data.$钓鱼_成功次数" label="$钓鱼成功次数" hint="钓鱼成功次数" />
              <FieldInput v-model="data.$钓鱼_鱼获记录" label="$鱼获记录" hint="钓鱼记录" />
              <FieldInput v-model="data.$钓鱼_最高记录" label="$最高记录" hint="最佳钓鱼记录" />
            </div>
          </div>

          <!-- 心魔系统 -->
          <div v-if="activeNav === 'demon'" class="edit-section">
            <SectionTitle icon="eye">心魔系统</SectionTitle>
            <div class="field-group">
              <FieldInput v-model="data.心魔名" label="心魔名" hint="心魔的名字" />
              <FieldInput v-model="data.心魔执念" label="心魔执念" hint="心魔的执念来源" />
              <FieldInput v-model="data.心魔态度" label="心魔态度" hint="对主角的态度" />
              <FieldInput v-model="data.心魔状态" label="心魔状态" hint="无/潜伏/活跃/压制" />
            </div>
            <SectionTitle icon="message">心魔记忆</SectionTitle>
            <textarea
              class="ce-textarea"
              v-model="data.$心魔记忆"
              placeholder="心魔相关的记忆片段..."
              rows="3"
            ></textarea>
          </div>

          <!-- 系统变量 -->
          <div v-if="activeNav === 'system'" class="edit-section">
            <SectionTitle icon="settings">系统控制变量</SectionTitle>
            <div class="help-inline">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#e0a040" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 2px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              以下变量由前端/脚本控制，除非明确知道在做什么否则请勿修改
            </div>
            <div class="field-group">
              <FieldInput v-model="data._当前百艺" label="_当前百艺" hint="当前正在操作的百艺类型" warn />
              <FieldInput v-model="data._修炼状态" label="_修炼状态" hint="修炼中/突破中/渡劫中/引气入体" warn />
              <FieldNumber v-model="data.$修炼进度" label="$修炼进度" hint="0~100修炼进度条" />
              <FieldInput v-model="data.习得百艺" label="习得百艺" hint="AI学习成功后的信号，脚本消费后清空" />
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="ce-footer">
          <button class="save-btn" @click="saveData" :disabled="saving">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 4px;">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
            </svg>
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
          <button class="reload-btn" @click="loadData">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align: -2px; margin-right: 4px;">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            重新加载
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Schema } from '../schema';
import FieldInput from './components/FieldInput.vue';
import FieldNumber from './components/FieldNumber.vue';
import FieldSelect from './components/FieldSelect.vue';
import SectionTitle from './components/SectionTitle.vue';

// ─── SVG 图标映射（用于导航栏） ───
const svgIcons: Record<string, string> = {
  'map-pin': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  'user': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'sword': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.5 2L22 9.5 9.5 22 2 14.5z"/><line x1="2" y1="22" x2="7" y2="17"/></svg>',
  'gem': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 22 8.5 12 22 2 8.5"/><line x1="2" y1="8.5" x2="22" y2="8.5"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
  'users': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'palette': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.38-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.02 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-9.96-10-9.96z"/></svg>',
  'anchor': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>',
  'eye': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  'settings': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};

// ─── 响应式尺寸 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const safeViewHeight = ref(hostWindow.innerHeight);
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 手机端抽屉高度 ───
const drawerHeight = computed(() => Math.floor(safeViewHeight.value * 0.88));

// ─── 手机端拖拽关闭 ───
const drawerTranslateY = ref(0);
let drawerStartY = 0;
let drawerHasMoved = false;

function onDrawerPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  drawerHasMoved = false;
  drawerStartY = e.clientY;
  drawerTranslateY.value = 0;
  hostWindow.addEventListener('pointermove', onDrawerPointerMove);
  hostWindow.addEventListener('pointerup', onDrawerPointerUp);
}

function onDrawerPointerMove(e: PointerEvent) {
  const dy = e.clientY - drawerStartY;
  if (!drawerHasMoved && Math.abs(dy) < DRAG_THRESHOLD) return;
  drawerHasMoved = true;
  drawerTranslateY.value = Math.max(0, dy);
}

function onDrawerPointerUp() {
  hostWindow.removeEventListener('pointermove', onDrawerPointerMove);
  hostWindow.removeEventListener('pointerup', onDrawerPointerUp);
  if (drawerTranslateY.value > 80) {
    isOpen.value = false;
  }
  drawerTranslateY.value = 0;
}

function updateSafeViewHeight() {
  const vv = (hostWindow as any).visualViewport;
  safeViewHeight.value = vv ? vv.height : hostWindow.innerHeight;
}

// ─── 常量 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = computed(() => isMobile.value ? 44 : 50);
const EDGE_GAP = 12;
const SNAP_OFFSET = computed(() => FAB_SIZE.value * 0.45);
const FAB_STORAGE_KEY = 'xiuxian-ce-fab';

// ─── 状态 ───
const isOpen = ref(false);
const showHelp = ref(false);
const saving = ref(false);
const activeNav = ref('location');
const targetFloor = ref<'latest' | 'custom'>('latest');
const customFloor = ref(0);
const currentMessageId = ref(-1);
const data = ref(Schema.parse({}));

// ─── 导航配置 ───
const navItems = [
  { key: 'location', icon: svgIcons['map-pin'], label: '位置' },
  { key: 'identity', icon: svgIcons['user'], label: '身份' },
  { key: 'gongfa', icon: svgIcons['sword'], label: '功法' },
  { key: 'items', icon: svgIcons['gem'], label: '物品' },
  { key: 'relations', icon: svgIcons['users'], label: '关系' },
  { key: 'arts', icon: svgIcons['palette'], label: '百艺' },
  { key: 'fishing', icon: svgIcons['anchor'], label: '钓鱼' },
  { key: 'demon', icon: svgIcons['eye'], label: '心魔' },
  { key: 'system', icon: svgIcons['settings'], label: '系统' },
];

// ─── 时辰选项 ───
const 时辰选项 = ['', '子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'];

// ─── 储物戒分类编辑 ───
const storageCategoryList = [
  { key: '储物戒_药材', label: '药材', placeholder: '千年灵芝 | 2\n百年何首乌 | 5' },
  { key: '储物戒_矿石', label: '矿石', placeholder: '寒铁 | 10\n秘银 | 3' },
  { key: '储物戒_丹药', label: '丹药', placeholder: '聚气丹 | 3\n筑基丹 | 1' },
  { key: '储物戒_符纸', label: '符纸', placeholder: '黄符纸 | 10' },
  { key: '储物戒_灵墨', label: '灵墨', placeholder: '朱砂灵墨 | 5' },
  { key: '储物戒_符箓', label: '符箓', placeholder: '火球符 | 3' },
  { key: '储物戒_灵材', label: '灵材', placeholder: '万年玄铁 | 1' },
  { key: '储物戒_阵旗', label: '阵旗', placeholder: '五行阵旗 | 5' },
  { key: '储物戒_饲料', label: '饲料', placeholder: '灵兽粮 | 10' },
  { key: '储物戒_傀儡件', label: '傀儡件', placeholder: '千年铁木 | 2' },
  { key: '储物戒_种子', label: '种子', placeholder: '灵芝种子 | 3' },
  { key: '储物戒_鱼饵', label: '鱼饵', placeholder: '灵蚯蚓 | 10' },
  { key: '储物戒_鱼获', label: '鱼获', placeholder: '青鳞鱼 | 2' },
  { key: '储物戒_成品', label: '成品', placeholder: '寒铁剑 | 1' },
  { key: '储物戒_杂物', label: '杂物', placeholder: '地图残页 | 1' },
  { key: '储物戒_其他', label: '其他', placeholder: '未分类物品 | 1' },
];

function formatCategoryItems(fieldKey: string): string {
  const record = (data.value as Record<string, unknown>)[fieldKey] as Record<string, number> | undefined;
  if (!record || typeof record !== 'object') return '';
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${name} | ${count}`)
    .join('\n');
}

function parseCategoryItems(fieldKey: string, text: string) {
  const result: Record<string, number> = {};
  text.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts[0]) {
      const count = parseInt(parts[1]) || 1;
      if (count > 0) {
        result[parts[0]] = (result[parts[0]] || 0) + count;
      }
    }
  });
  (data.value as Record<string, unknown>)[fieldKey] = result;
}

// ─── FAB 位置持久化 ───
function readFabPosition(): { x: number; y: number } | null {
  try {
    const raw = hostWindow.localStorage.getItem(FAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveFabPosition(pos: { x: number; y: number }) {
  try {
    hostWindow.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

function clampFabPosition(x: number, y: number): { x: number; y: number } {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabS = FAB_SIZE.value;
  return {
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - fabS - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - fabS - EDGE_GAP)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  return { x: vw - FAB_SIZE.value - 20, y: vh - FAB_SIZE.value - 140 };
}

const fabPosition = ref((() => {
  const saved = readFabPosition();
  const pos = saved ?? defaultFabPosition();
  return clampFabPosition(pos.x, pos.y);
})());

function updateFabPosition(x: number, y: number) {
  const clamped = clampFabPosition(x, y);
  fabPosition.value = clamped;
  saveFabPosition(clamped);
}

// ─── FAB 样式 ───
const fabStyle = computed(() => ({
  left: fabPosition.value.x + 'px',
  top: fabPosition.value.y + 'px',
  width: FAB_SIZE.value + 'px',
  height: FAB_SIZE.value + 'px',
}));

// ─── 面板尺寸 ───
const panelWidth = computed(() => isMobile.value ? windowWidth.value : Math.min(520, Math.round(windowWidth.value * 0.45)));
const panelHeight = computed(() => isMobile.value ? windowHeight.value : Math.min(700, Math.round(windowHeight.value * 0.85)));

// ─── 面板位置 ───
const panelOffset = ref<{ x: number; y: number } | null>(null);

function calcPanelInitialPos() {
  if (isMobile.value) return { x: 0, y: 0 };
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const pw = panelWidth.value;
  const ph = panelHeight.value;
  const fabX = fabPosition.value.x;
  const fabY = fabPosition.value.y;
  const fabS = FAB_SIZE.value;

  let left = fabX > vw * 0.5 ? fabX + fabS - pw : fabX;
  left = _.clamp(left, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP));

  const above = fabY - ph - 12;
  const below = fabY + fabS + 12;
  let top: number;
  if (above >= EDGE_GAP) top = above;
  else if (below + ph <= vh - EDGE_GAP) top = below;
  else top = _.clamp(above, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP));

  return { x: left, y: top };
}

const panelStyle = computed(() => {
  if (isMobile.value) {
    const h = drawerHeight.value;
    const vh = safeViewHeight.value || hostWindow.innerHeight;
    const topPos = vh - h;
    return {
      top: topPos + 'px',
      left: '0px',
      right: '0px',
      width: '100%',
      height: h + 'px',
      transform: drawerTranslateY.value > 0 ? `translateY(${drawerTranslateY.value}px)` : undefined,
    };
  }
  const pos = panelOffset.value ?? calcPanelInitialPos();
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    width: panelWidth.value + 'px',
    height: panelHeight.value + 'px',
  };
});

// ─── FAB 拖动 ───
const fabRef = ref<HTMLButtonElement | null>(null);
const isDragging = ref(false);
const justOpened = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
let hasMoved = false;

function snapToEdge(x: number, y: number): { x: number; y: number } {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabS = FAB_SIZE.value;
  const snapOff = SNAP_OFFSET.value;
  const clampedY = _.clamp(y, EDGE_GAP, vh - fabS - EDGE_GAP);
  if (x + fabS / 2 < vw / 2) {
    return { x: -snapOff, y: clampedY };
  } else {
    return { x: vw - fabS + snapOff, y: clampedY };
  }
}

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  isDragging.value = false;
  hasMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragBaseX = fabPosition.value.x;
  dragBaseY = fabPosition.value.y;
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  hasMoved = true;
  isDragging.value = true;
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabS = FAB_SIZE.value;
  const snapOff = SNAP_OFFSET.value;
  const x = _.clamp(dragBaseX + dx, -snapOff, vw - fabS + snapOff);
  const y = _.clamp(dragBaseY + dy, EDGE_GAP, vh - fabS - EDGE_GAP);
  updateFabPosition(x, y);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) {
    isOpen.value = true;
  } else if (isMobile.value) {
    const snapped = snapToEdge(fabPosition.value.x, fabPosition.value.y);
    updateFabPosition(snapped.x, snapped.y);
  }
}

// ─── 面板拖动 ───
const isPanelDragging = ref(false);
let panelDragStartX = 0;
let panelDragStartY = 0;
let panelDragBaseX = 0;
let panelDragBaseY = 0;
let panelHasMoved = false;

function onPanelPointerDown(e: PointerEvent) {
  if (e.button !== 0 || isMobile.value) return;
  e.preventDefault();
  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStartX = e.clientX;
  panelDragStartY = e.clientY;
  const currentPos = panelOffset.value ?? calcPanelInitialPos();
  panelDragBaseX = currentPos.x;
  panelDragBaseY = currentPos.y;
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(e: PointerEvent) {
  const dx = e.clientX - panelDragStartX;
  const dy = e.clientY - panelDragStartY;
  if (!panelHasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  panelHasMoved = true;
  isPanelDragging.value = true;
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  panelOffset.value = {
    x: _.clamp(panelDragBaseX + dx, EDGE_GAP, Math.max(EDGE_GAP, vw - panelWidth.value - EDGE_GAP)),
    y: _.clamp(panelDragBaseY + dy, EDGE_GAP, Math.max(EDGE_GAP, vh - panelHeight.value - EDGE_GAP)),
  };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

// ─── 窗口 resize ───
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
  updateSafeViewHeight();
  if (isMobile.value && !isOpen.value) {
    const snapped = snapToEdge(fabPosition.value.x, fabPosition.value.y);
    updateFabPosition(snapped.x, snapped.y);
  }
  if (panelOffset.value && !isMobile.value) {
    const vw = hostWindow.innerWidth;
    const vh = hostWindow.innerHeight;
    panelOffset.value = {
      x: _.clamp(panelOffset.value.x, EDGE_GAP, Math.max(EDGE_GAP, vw - panelWidth.value - EDGE_GAP)),
      y: _.clamp(panelOffset.value.y, EDGE_GAP, Math.max(EDGE_GAP, vh - panelHeight.value - EDGE_GAP)),
    };
  }
};

watch(isOpen, (open) => {
  if (open) {
    panelOffset.value = null;
    drawerTranslateY.value = 0;
    justOpened.value = true;
    updateSafeViewHeight();
    loadData();
    setTimeout(() => { justOpened.value = false; }, 300);
  }
});

// ─── 数据操作 ───
function getTargetMessageId(): number {
  if (targetFloor.value === 'custom' && customFloor.value >= 0) {
    return customFloor.value;
  }
  return getLastMessageId();
}

function loadData() {
  try {
    const msgId = getTargetMessageId();
    currentMessageId.value = msgId;
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: msgId });
    const statData = _.get(mvuData, 'stat_data');
    if (statData) {
      data.value = Schema.parse(statData);
    } else {
      data.value = Schema.parse({});
      toastr.warning(`楼层 #${msgId} 没有变量数据`, 'CE修改器');
    }
  } catch (e) {
    console.error('[CE修改器] 读取数据失败:', e);
    toastr.error('读取变量数据失败', 'CE修改器');
  }
}

async function saveData() {
  saving.value = true;
  try {
    const msgId = getTargetMessageId();
    currentMessageId.value = msgId;
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: msgId });
    const updated = _.cloneDeep(mvuData);
    _.set(updated, 'stat_data', klona(data.value));
    await Mvu.replaceMvuData(updated, { type: 'message', message_id: msgId });
    toastr.success(`已保存到楼层 #${msgId}`, 'CE修改器');
  } catch (e) {
    console.error('[CE修改器] 保存数据失败:', e);
    toastr.error('保存变量数据失败', 'CE修改器');
  } finally {
    saving.value = false;
  }
}

// ─── 术法解析 ───
function formatSkills(skills: Record<string, string>): string {
  return Object.entries(skills).map(([name, level]) => `${name} | ${level}`).join('\n');
}

function parseSkills(text: string) {
  const result: Record<string, string> = {};
  text.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts[0]) {
      result[parts[0]] = parts[1] || '入门';
    }
  });
  data.value.习得术法 = result;
}

// ─── 关系解析 ───
function formatRelations(relations: Record<string, string>): string {
  return Object.entries(relations).map(([name, desc]) => `${name} | ${desc}`).join('\n');
}

function parseRelations(text: string) {
  const result: Record<string, string> = {};
  text.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const idx = trimmed.indexOf('|');
    if (idx > 0) {
      const name = trimmed.substring(0, idx).trim();
      const desc = trimmed.substring(idx + 1).trim();
      if (name) result[name] = desc;
    } else {
      result[trimmed] = '';
    }
  });
  data.value.关系列表 = result;
}

// ─── 生命周期 ───
onMounted(() => {
  hostWindow.addEventListener('resize', onResize);
  updateSafeViewHeight();
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.addEventListener('resize', updateSafeViewHeight);
  if (isMobile.value) {
    const snapped = snapToEdge(fabPosition.value.x, fabPosition.value.y);
    updateFabPosition(snapped.x, snapped.y);
  }
});

onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResize);
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.removeEventListener('resize', updateSafeViewHeight);
});
</script>

<style scoped>
/* ─── 全局变量 ─── */
.ce-root {
  --ce-bg: rgba(18, 14, 10, 0.96);
  --ce-border: rgba(200, 169, 110, 0.3);
  --ce-text: #f0e6d0;
  --ce-text-secondary: #c8b48c;
  --ce-text-muted: #8a7e6a;
  --ce-accent: #c8a96e;
  --ce-accent-hover: #e0bf7a;
  --ce-card-bg: rgba(35, 28, 18, 0.85);
  --ce-input-bg: rgba(20, 16, 10, 0.8);
  --ce-input-border: rgba(200, 169, 110, 0.2);
  --ce-input-focus: rgba(200, 169, 110, 0.5);
  --ce-danger: #e05555;
  --ce-warn-bg: rgba(224, 85, 85, 0.08);
  --ce-success: #5db87a;
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
}

/* ─── FAB ─── */
.ce-fab {
  position: fixed;
  border-radius: 50%;
  border: 2px solid var(--ce-border);
  background: var(--ce-bg);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(200, 169, 110, 0.2);
  transition: box-shadow 0.2s, opacity 0.3s, transform 0.3s;
  padding: 0;
  z-index: 9999;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.ce-fab:hover { box-shadow: 0 6px 24px rgba(200, 169, 110, 0.3); }
.ce-fab:active, .ce-fab.is-dragging { cursor: grabbing; }

.ce-fab.is-snapped {
  opacity: 0.7;
  transition: left 0.3s ease, top 0.3s ease, opacity 0.3s ease;
  animation: fab-breathe 3s ease-in-out infinite;
}
.ce-fab.is-snapped:hover { opacity: 1; animation: none; }

@keyframes fab-breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.85; }
}

/* ─── 面板 ─── */
.ce-panel {
  position: fixed;
  border-radius: 12px;
  overflow: hidden;
  z-index: 9999;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  background: var(--ce-bg);
  border: 1px solid var(--ce-border);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

/* 手机端遮罩层 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  pointer-events: auto;
}

/* 手机端底部抽屉 */
.ce-panel.is-drawer {
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  will-change: transform;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 拖拽把手 */
.drawer-handle {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 4px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  flex-shrink: 0;
}
.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--ce-text-muted);
  opacity: 0.4;
}
.drawer-handle:active .handle-bar { opacity: 0.7; }

.is-drawer .ce-topbar { cursor: default; }

/* ─── 顶栏 ─── */
.ce-topbar {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ce-border);
  background: linear-gradient(135deg, rgba(30, 22, 12, 0.95), rgba(40, 30, 18, 0.95));
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}
.ce-topbar.is-dragging { cursor: grabbing; }

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.topbar-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--ce-accent);
  letter-spacing: 1px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ce-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.topbar-btn:hover { background: rgba(200, 169, 110, 0.1); color: var(--ce-accent); }
.close-btn:hover { color: var(--ce-danger); }

/* ─── 楼层选择栏 ─── */
.floor-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--ce-border);
  background: rgba(25, 20, 14, 0.9);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.floor-label {
  font-size: 12px;
  color: var(--ce-text-muted);
  white-space: nowrap;
}

.floor-btn {
  padding: 4px 10px;
  border: 1px solid var(--ce-input-border);
  border-radius: 4px;
  background: var(--ce-input-bg);
  color: var(--ce-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.floor-btn.active {
  border-color: var(--ce-accent);
  color: var(--ce-accent);
  background: rgba(200, 169, 110, 0.1);
}

.floor-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.floor-input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid var(--ce-input-border);
  border-radius: 4px;
  background: var(--ce-input-bg);
  color: var(--ce-text);
  font-size: 11px;
  text-align: center;
}
.floor-input:focus {
  outline: none;
  border-color: var(--ce-input-focus);
}

.floor-go-btn {
  padding: 4px 8px;
  border: 1px solid var(--ce-accent);
  border-radius: 4px;
  background: rgba(200, 169, 110, 0.15);
  color: var(--ce-accent);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.floor-go-btn:hover { background: rgba(200, 169, 110, 0.25); }

.floor-info {
  font-size: 11px;
  color: var(--ce-text-muted);
  margin-left: auto;
}

/* ─── 帮助面板 ─── */
.help-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 8, 5, 0.97);
  z-index: 10;
  overflow-y: auto;
  padding: 20px;
}

.help-content {
  max-width: 440px;
  margin: 0 auto;
}

.help-content h3 {
  color: var(--ce-accent);
  font-size: 18px;
  margin-bottom: 16px;
  text-align: center;
}

.help-section {
  margin-bottom: 16px;
}

.help-section h4 {
  color: var(--ce-text);
  font-size: 14px;
  margin-bottom: 8px;
}

.help-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-section li {
  color: var(--ce-text-secondary);
  font-size: 12px;
  line-height: 1.8;
  padding-left: 12px;
  position: relative;
}

.help-section li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--ce-accent);
}

.help-section code {
  background: rgba(200, 169, 110, 0.15);
  color: var(--ce-accent);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.help-close-btn {
  display: block;
  margin: 20px auto 0;
  padding: 8px 32px;
  border: 1px solid var(--ce-accent);
  border-radius: 6px;
  background: rgba(200, 169, 110, 0.15);
  color: var(--ce-accent);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.help-close-btn:hover { background: rgba(200, 169, 110, 0.25); }

/* ─── 导航栏 ─── */
.nav-bar {
  display: flex;
  padding: 0;
  border-bottom: 1px solid var(--ce-border);
  background: rgba(25, 20, 14, 0.95);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-bar::-webkit-scrollbar { display: none; }

.nav-btn {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--ce-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-width: 48px;
  gap: 2px;
}

.nav-btn:hover { color: var(--ce-accent); background: rgba(200, 169, 110, 0.05); }
.nav-btn.active { color: var(--ce-accent); }
.nav-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--ce-accent);
  border-radius: 1px;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
}
.nav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }

/* ─── 内容区 ─── */
.ce-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 14px;
}

.ce-body::-webkit-scrollbar { width: 4px; }
.ce-body::-webkit-scrollbar-track { background: transparent; }
.ce-body::-webkit-scrollbar-thumb { background: rgba(200, 169, 110, 0.25); border-radius: 2px; }

.edit-section {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.help-inline {
  font-size: 11px;
  color: var(--ce-text-muted);
  margin-bottom: 6px;
  line-height: 1.5;
}

.help-inline code {
  background: rgba(200, 169, 110, 0.12);
  color: var(--ce-accent);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group.compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

/* ─── textarea ─── */
.ce-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--ce-input-border);
  border-radius: 6px;
  background: var(--ce-input-bg);
  color: var(--ce-text);
  font-size: 12px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  margin-bottom: 4px;
  box-sizing: border-box;
}
.ce-textarea:focus {
  outline: none;
  border-color: var(--ce-input-focus);
}
.ce-textarea::placeholder {
  color: var(--ce-text-muted);
  opacity: 0.6;
}

/* ─── 底部栏 ─── */
.ce-footer {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--ce-border);
  background: rgba(25, 20, 14, 0.95);
  flex-shrink: 0;
}

.save-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--ce-success);
  border-radius: 6px;
  background: rgba(93, 184, 122, 0.15);
  color: var(--ce-success);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}
.save-btn:hover:not(:disabled) { background: rgba(93, 184, 122, 0.25); }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.reload-btn {
  padding: 10px 16px;
  border: 1px solid var(--ce-border);
  border-radius: 6px;
  background: rgba(200, 169, 110, 0.08);
  color: var(--ce-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.reload-btn:hover { color: var(--ce-accent); border-color: var(--ce-accent); }

/* ─── 过渡动画 ─── */
.fab-enter-active, .fab-leave-active { transition: opacity 0.25s ease; }
.fab-enter-from, .fab-leave-to { opacity: 0; }

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.3s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.panel-enter-active, .panel-leave-active { transition: all 0.3s ease; }
.panel-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.panel-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-enter-from { transform: translateY(100%); }
.drawer-leave-to { transform: translateY(100%); }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from { opacity: 0; transform: translateY(-10px); }
.slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* ─── 储物戒分类编辑 ─── */
.storage-cat-section {
  margin-bottom: 8px;
}

.storage-cat-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--ce-accent);
  margin-bottom: 4px;
  padding-left: 2px;
  letter-spacing: 1px;
}

.storage-cat-section .ce-textarea {
  min-height: 40px;
  font-size: 11px;
}

/* ─── 手机适配 ─── */
@media (max-width: 500px) {
  .topbar-title { font-size: 13px; }
  .nav-btn { padding: 6px 8px; min-width: 42px; }
  .nav-icon { height: 14px; }
  .nav-label { font-size: 9px; }
  .ce-body { padding: 10px 10px; }
  .field-group.compact { grid-template-columns: 1fr; }
  .floor-bar { padding: 6px 10px; gap: 6px; }
}
</style>
