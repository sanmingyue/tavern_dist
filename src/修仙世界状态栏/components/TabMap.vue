 <template>
  <div class="tab-map">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <button
        v-for="(crumb, idx) in breadcrumbs"
        :key="idx"
        class="crumb"
        :class="{ active: idx === breadcrumbs.length - 1 }"
        @click="navigateTo(idx)"
      >
        <span v-if="idx > 0" class="crumb-sep">›</span>
        {{ crumb }}
      </button>
    </div>

    <!-- 第三层：文字列表视图 -->
    <div v-if="currentLayer === '三层'" class="layer3-container">
      <!-- 区域标题 -->
      <div class="layer3-header">
        <div class="layer3-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{{ currentSubRegion }}</span>
        </div>
        <div class="layer3-subtitle">具体地点</div>
      </div>

      <!-- 地点列表 -->
      <div class="layer3-list">
        <div
          v-for="marker in currentMarkers"
          :key="marker.id"
          class="layer3-card"
          :class="{ 'is-current': isCurrentLocation(marker) }"
          @click="onLayer3CardClick(marker)"
        >
          <div class="card-color-bar" :style="{ background: marker.颜色 }"></div>
          <div class="card-content">
            <div class="card-header">
              <span class="card-name" :style="{ color: marker.颜色 }">{{ marker.名称 }}</span>
              <span class="card-type">{{ getLocationTypeName(marker.类型 || '具体地点') }}</span>
              <span v-if="isCurrentLocation(marker)" class="card-current-badge">当前</span>
            </div>
            <div v-if="marker.势力" class="card-faction">
              <span class="faction-dot" :style="{ background: getFactionColor(marker.势力) }"></span>
              {{ marker.势力 }}
            </div>
            <div v-if="marker.简介" class="card-desc">{{ marker.简介 }}</div>
            <div v-if="marker.角色列表 && marker.角色列表.length > 0" class="card-characters">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{{ marker.角色列表.slice(0, 3).join('、') }}<span v-if="marker.角色列表.length > 3">等{{ marker.角色列表.length }}人</span></span>
            </div>
          </div>
          <div class="card-actions">
            <button
              v-if="!isCurrentLocation(marker)"
              class="card-action-btn primary"
              @click.stop="setLayer3AsLocation(marker)"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              前往
            </button>
            <button
              v-else
              class="card-action-btn active"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              当前位置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 一层、二层：地图视图 -->
    <template v-else>
      <!-- 地图容器 -->
      <div
        ref="mapContainerRef"
        class="map-container"
        :class="{ dragging: isDragging }"
        @mousedown="onMapMouseDown"
        @touchstart.passive="onTouchStart"
        @wheel.prevent="onMapWheel"
      >
        <div
          class="map-world"
          :class="{ 'no-transition': isDragging }"
          :style="{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }"
        >
          <!-- 使用 img 标签替代 background-image, 确保标点百分比与图片对齐 -->
          <img
            :src="currentMapImage"
            class="map-image"
            draggable="false"
            @load="onMapImageLoad"
          />

          <!-- 地图标点 -->
          <div
            v-for="marker in currentMarkers"
            :key="marker.id"
            class="marker"
            :class="[`marker-${marker.标记大小}`]"
            :style="{
              left: marker.x + '%',
              top: marker.y + '%',
              '--marker-color': marker.颜色,
            }"
            @click.stop="onMarkerClick(marker)"
          >
            <div class="marker-dot" :style="{ background: marker.颜色, boxShadow: `0 0 8px ${marker.颜色}` }"></div>
            <div class="marker-label" :class="`label-${marker.标签位置}`" :style="{ color: marker.颜色 }">
              {{ marker.名称 }}
            </div>
          </div>
        </div>

        <!-- 地图控制按钮 -->
        <div class="map-controls">
          <button class="ctrl-btn" title="放大" @click="zoomIn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button class="ctrl-btn" title="缩小" @click="zoomOut">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button class="ctrl-btn" title="重置视图" @click="resetView">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>

        <!-- 当前位置指示 -->
        <div v-if="currentLocation" class="current-location">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {{ currentLocation }}
        </div>
      </div>
    </template>

    <!-- 地点详情面板 -->
    <Transition name="slide">
      <div v-if="selectedMarker" class="location-panel" @click.stop>
        <div class="panel-header">
          <div class="panel-title">
            <span class="location-type">{{ getLocationTypeName(selectedMarker.类型 || '具体地点') }}</span>
            <h3>{{ selectedMarker.名称 }}</h3>
          </div>
          <button class="panel-close" @click="selectedMarker = null">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="panel-body">
          <!-- 简介 -->
          <div v-if="selectedMarker.简介" class="info-section">
            <p>{{ selectedMarker.简介 }}</p>
          </div>

          <!-- 势力 -->
          <div v-if="selectedMarker.势力" class="info-section">
            <div class="section-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              势力
            </div>
            <span class="faction-badge" :style="{ background: getFactionColor(selectedMarker.势力) }">
              {{ selectedMarker.势力 }}
            </span>
          </div>

          <!-- 角色列表 -->
          <div v-if="selectedMarker.角色列表 && selectedMarker.角色列表.length > 0" class="info-section">
            <div class="section-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              此地人物
            </div>
            <div class="character-list">
              <div v-for="char in selectedMarker.角色列表" :key="char" class="character-item">
                {{ char }}
              </div>
            </div>
          </div>

          <!-- 钓鱼信息 -->
          <div v-if="fishingInfo" class="info-section">
            <div class="section-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8c0-4-6-4-6 2s6 6 6 0" />
                <line x1="12" y1="10" x2="12" y2="22" />
              </svg>
              钓鱼资源
            </div>
            <div class="fishing-details">
              <div v-for="(line, idx) in fishingInfo.split('\n')" :key="idx" class="fishing-line">
                {{ line }}
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="panel-actions">
            <!-- 展开子区域按钮：一层、二层显示（前提是该标记有子区域且有三层数据） -->
            <button
              v-if="canExpandSubRegion(selectedMarker)"
              class="action-btn primary"
              @click="expandSubRegion"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M3 9h18" />
              </svg>
              进入区域
            </button>

            <!-- 移动到此处（与AI互动） -->
            <button
              v-if="!isCurrentLocation(selectedMarker)"
              class="action-btn secondary"
              @click="startNavigation"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              前往此处
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 移动确认弹窗 -->
    <Transition name="fade">
      <div v-if="showTravelConfirm" class="travel-overlay" @click="showTravelConfirm = false">
        <div class="travel-modal" @click.stop>
          <div class="modal-header">
            <h3>确认移动</h3>
            <button class="modal-close" @click="showTravelConfirm = false">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="travel-route">
              <div class="route-point from">
                <div class="route-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                </div>
                <div class="route-info">
                  <span class="route-label">从</span>
                  <span class="route-name">{{ travelConfirmData.from }}</span>
                </div>
              </div>

              <div class="route-arrow">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>

              <div class="route-point to">
                <div class="route-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="3" fill="#fff" />
                  </svg>
                </div>
                <div class="route-info">
                  <span class="route-label">至</span>
                  <span class="route-name">{{ travelConfirmData.to }}</span>
                </div>
              </div>
            </div>

            <div class="travel-options">
              <div class="option-row">
                <label>移动方式</label>
                <div class="option-buttons">
                  <button
                    v-for="method in travelMethods"
                    :key="method.value"
                    :class="{ active: travelMethod === method.value }"
                    @click="travelMethod = method.value"
                  >
                    {{ method.label }}
                  </button>
                </div>
              </div>

              <!-- 传送阵信息 -->
              <div v-if="travelMethod === '传送阵'" class="teleport-cost-section">
                <!-- 传送不可用 -->
                <div v-if="!teleportAvailability.available" class="cost-info insufficient">
                  <div class="cost-header">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>无法传送</span>
                  </div>
                  <div class="cost-warning">
                    {{ teleportAvailability.reason }}
                  </div>
                </div>
                <!-- 传送可用 -->
                <div v-else class="cost-info" :class="{ 'insufficient': !canAffordTeleport }">
                  <div class="cost-header">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span>传送费用</span>
                  </div>
                  <div class="cost-detail">
                    <span class="cost-amount">{{ teleportCost }} 下品灵石</span>
                    <span class="cost-balance">（持有：{{ store.灵石总量 }}）</span>
                  </div>
                  <div v-if="!canAffordTeleport" class="cost-warning">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    灵石不足，无法使用传送阵
                  </div>
                  <div v-if="teleportCostNote" class="cost-note">
                    {{ teleportCostNote }}
                  </div>
                </div>
              </div>

              <!-- 跨区域提示 -->
              <div v-if="isCrossRegionTravel" class="cross-region-notice">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>跨区域移动，路途较远</span>
              </div>
            </div>

            <div class="travel-message">
              <label>移动描述（可选）</label>
              <textarea v-model="travelMessage" placeholder="描述此次移动的过程或目的..." rows="3"></textarea>
            </div>

            <!-- 内容预览 -->
            <div v-if="travelPreviewContent" class="preview-box">
              <div class="preview-label">发送预览</div>
              <div class="preview-content">{{ travelPreviewContent }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showTravelConfirm = false">取消</button>
            <!-- 步骤1：设置当前位置 -->
            <button
              v-if="!locationSet"
              class="btn-set-location"
              @click="setLocationVariables"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="3" />
              </svg>
              设置当前位置
            </button>
            <button
              v-else
              class="btn-set-location done"
              disabled
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              位置已设置
            </button>
            <!-- 步骤2：确认前往 -->
            <button
              class="btn-confirm"
              :disabled="!locationSet || (travelMethod === '传送阵' && (!teleportAvailability.available || !canAffordTeleport))"
              @click="confirmTravel"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {{ travelMethod === '传送阵' ? '确认传送' : '确认前往' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStatusStore } from '../store';
import type { 地图标记, 地图层级 } from '../types/map';
import { 地图标记数据, getMarkersByRegion, getMarkersBySubRegion, getFishingInfo } from './mapData';

// ═══════════════════════════════════════════════════
// 传送阵系统配置
// ═══════════════════════════════════════════════════

// ─── 拥有传送阵的地点（仅限大型城市/商业枢纽） ───
const TELEPORT_LOCATIONS: Set<string> = new Set([
  // 中央神州城市
  '万象城', '天机城', '天启城', '流金城', '剑鸣城',
  '临渊城', '百兽城', '百草集', '常春城', '玄渊城',
  '莲华镇', '青云城', '熔金城', '苍澜城', '星落镇',
  // 四海
  '碧波城',
  // 西漠佛国
  '琉璃城', '清泉镇',
  // 南疆巫地
  '千虫市集', '黑水寨',
  // 北原魔土（魔道传送阵）
  '天魔帝都', '永夜城', '黑冰港', '火山集市',
  // 子区域级传送（各区域主城）
  '天脊中枢', '星辰山脉', '丹霞灵原', '天启城域',
  '北境寒域', '西域草原', '万剑山脉', '东南暗域', '南境水乡',
  '灵山净土', '绿洲带',
  '巫神教', '药神谷', '赤阳谷',
  '天魔帝都', '焚魔焦土', '寂灭海',
  '东溟海', '南离海', '北冥海',
]);

// ─── 完全禁止传送的区域 ───
const NO_TELEPORT_REGIONS: Set<string> = new Set([
  '大魔国',     // 隐于洞天之中，无传送阵可达
  '东瀛',       // 结界封锁，完全隔绝
  '阴曹地府',   // 冥界，需特殊通道
]);

// ─── 宗门/势力禁地（外人不能传送进入） ───
const SECT_LOCATIONS: Set<string> = new Set([
  // 宗门山门 - 外人进不去
  '天剑圣地', '玉清道宫', '万法宗', '丹宗', '百草庐',
  '玄天宗', '太虚宗', '灵霄宗', '凛霜剑门', '青云宗', '天仙门',
  '剑宗', '噬心殿', '归稚宗', '蝶化宗', '并蒂宫',
  '合欢宗', '万兽山庄', '苍澜国',
  '小雷音寺', '幽冥魔宗',
  '巫神教', '药神谷', '万毒神教', '蛊魔宗',
  '玲珑绣阁', '极乐宫',
  '万禁教', '幽血门', '万法楼',
  '魅花宫',
  // 势力/特殊地点
  '天命神教', '墨家机关城', '东海龙宫', '南海龙宫', '珊瑚宫',
  '万魔殿', '禁锢要塞', '幽渊战堡',
  '天蛛圣殿', '蛊祖祭坛', '红尘殿',
  '生命古树', '王庭', '圣女峰',
  '皇城', '幕府殿', '伊势大社',
  // 特殊地点
  '红尘酒家', '龙墓', '风暴之眼', '三仙岛', '归墟魔渊',
  '熔火之心', '冰封墓场', '六道轮回盘',
]);

// ─── 大区域间的"距离等级"（用于计算费用） ───
// 0=同区域内, 1=相邻, 2=较远, 3=对角
const REGION_DISTANCE: Record<string, Record<string, number>> = {
  '中央神州': { '中央神州': 0, '东荒妖域': 1, '北原魔土': 1, '西漠佛国': 1, '南疆巫地': 1, '四海': 1 },
  '东荒妖域': { '中央神州': 1, '东荒妖域': 0, '北原魔土': 2, '西漠佛国': 3, '南疆巫地': 2, '四海': 1 },
  '北原魔土': { '中央神州': 1, '东荒妖域': 2, '北原魔土': 0, '西漠佛国': 2, '南疆巫地': 3, '四海': 2 },
  '西漠佛国': { '中央神州': 1, '东荒妖域': 3, '北原魔土': 2, '西漠佛国': 0, '南疆巫地': 1, '四海': 2 },
  '南疆巫地': { '中央神州': 1, '东荒妖域': 2, '北原魔土': 3, '西漠佛国': 1, '南疆巫地': 0, '四海': 1 },
  '四海':     { '中央神州': 1, '东荒妖域': 1, '北原魔土': 2, '西漠佛国': 2, '南疆巫地': 1, '四海': 0 },
};

// ─── 基础费用 ───
const TELEPORT_BASE_COST = 50;        // 同子区域内传送
const TELEPORT_CROSS_SUB = 200;       // 同大区域跨子区域
const TELEPORT_ADJACENT = 500;        // 相邻大区域
const TELEPORT_FAR = 1000;            // 较远大区域
const TELEPORT_DIAGONAL = 2000;       // 对角大区域

// ─── Store ───
const store = useStatusStore();

// ─── 状态 ───
const mapContainerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const zoom = ref(1);
const baseZoom = ref(1); // 适配容器时的初始缩放值
const panX = ref(0);
const panY = ref(0);

// 导航状态
const currentLayer = ref<地图层级>('一层');
const currentRegion = ref<string | null>(null); // 当前查看的区域（二层时使用）
const currentSubRegion = ref<string | null>(null); // 当前查看的子区域（三层时使用）
const breadcrumbs = ref<string[]>(['阴阳大陆']);
const selectedMarker = ref<地图标记 | null>(null);
const showTravelConfirm = ref(false);
const locationSet = ref(false); // 追踪「设置当前位置」是否已完成

// 移动确认数据
const travelMethod = ref('御空飞行');
const travelMessage = ref('');

// ─── 地图数据 ───
const travelMethods = [
  { value: '御剑飞行', label: '御剑' },
  { value: '御空飞行', label: '御空' },
  { value: '传送阵', label: '传送阵' },
  { value: '步行', label: '步行' },
  { value: '骑乘', label: '骑乘' },
  { value: '乘船', label: '乘船' },
];


// ─── 计算属性 ───
const regionMapUrls: Record<string, string> = {
  '中央神州': 'https://i.postimg.cc/N0pCBRRF/di2ceng-zhong-yang-shen-zhou-yu-tu.png',
  '东荒妖域': 'https://i.postimg.cc/5yHRPjY9/di2ceng-dong-huang-yao-yu-yu-tu.png',
  '北原魔土': 'https://i.postimg.cc/kGVpjD6n/di2ceng-bei-yuan-mo-tu-yu-tu.png',
  '西漠佛国': 'https://i.postimg.cc/RZ1bpkFL/di2ceng-xi-mo-fu-guo-yu-tu.png',
  '南疆巫地': 'https://i.postimg.cc/pXFSzhMk/di2ceng-nan-jiang-wu-de-yu-tu.png',
  '四海': 'https://i.postimg.cc/52WR34xt/di2ceng-si-hai-yu-tu.png',
  '大魔国': 'https://i.postimg.cc/hvJ5Chzg/di2ceng-da-mo-guo-yu-tu.png',
  '东瀛': 'https://i.postimg.cc/xj77XGhf/di2ceng-dong-ying-yu-tu.png',
  '阴曹地府': 'https://i.postimg.cc/tgXvKBnQ/di2ceng-yin-cao-de-fu-yu-tu.png',
};

const currentMapImage = computed(() => {
  if (currentLayer.value === '一层') {
    return 'https://i.postimg.cc/s2ybVV8Q/di1ceng-yin-yang-da-lu-yu-tu.png';
  }

  // 三层地图：使用父区域的地图（没有专门的三层地图图片）
  if (currentLayer.value === '三层' && currentRegion.value) {
    return regionMapUrls[currentRegion.value] || '';
  }

  // 二层地图
  if (currentRegion.value) {
    return regionMapUrls[currentRegion.value] || '';
  }

  return '';
});

const currentMarkers = computed(() => {
  if (currentLayer.value === '一层') {
    return 地图标记数据.filter((m: any) => m.层级 === '一层');
  }

  if (currentLayer.value === '三层' && currentSubRegion.value) {
    return getMarkersBySubRegion(currentSubRegion.value);
  }

  if (currentLayer.value === '二层' && currentRegion.value) {
    return getMarkersByRegion(currentRegion.value);
  }

  return [];
});

const currentLocation = computed(() => {
  const d = store.data;
  if (d.具体地点) return `${d.子区域}·${d.具体地点}`;
  if (d.子区域) return d.子区域;
  if (d.大区域) return d.大区域;
  return null;
});

const travelConfirmData = computed(() => ({
  from: currentLocation.value || '未知位置',
  to: selectedMarker.value?.名称 || '未知地点',
}));

// ─── 传送阵可用性判断 ───

/** 获取地点的传送阵可用性 */
function getTeleportAvailability(marker: 地图标记): { available: boolean; reason: string } {
  const name = marker.名称;
  const region = marker.所属区域 || name;

  // 1. 整个大区域禁止传送
  if (NO_TELEPORT_REGIONS.has(region)) {
    const reasons: Record<string, string> = {
      '大魔国': '大魔国隐于洞天之中，无传送阵可通达',
      '东瀛': '东瀛被古老结界封锁，无法传送',
      '阴曹地府': '阴曹地府为冥界，需特殊通道进入',
    };
    return { available: false, reason: reasons[region] || `${region}无法传送` };
  }

  // 2. 宗门/势力禁地
  if (marker.层级 === '三层' && SECT_LOCATIONS.has(name)) {
    return { available: false, reason: `${name}为宗门禁地，外人不得擅入，无公共传送阵` };
  }

  // 3. 检查出发地是否有传送阵
  // (出发地检查在 computed 中做)

  // 4. 目的地是否有传送阵
  if (marker.层级 === '三层') {
    // 三层地点：只有城市类有传送阵
    if (TELEPORT_LOCATIONS.has(name)) {
      return { available: true, reason: '' };
    }
    return { available: false, reason: `${name}没有传送阵，需先传送到附近城镇` };
  }

  if (marker.层级 === '二层') {
    // 二层子区域：有主城的区域可传送
    if (TELEPORT_LOCATIONS.has(name)) {
      return { available: true, reason: '' };
    }
    // 检查该子区域下是否有带传送阵的城市
    const subMarkers = getMarkersBySubRegion(name);
    const hasTeleport = subMarkers.some(m => TELEPORT_LOCATIONS.has(m.名称));
    if (hasTeleport) {
      return { available: true, reason: '' };
    }
    return { available: false, reason: `${name}没有传送阵设施` };
  }

  if (marker.层级 === '一层') {
    if (NO_TELEPORT_REGIONS.has(name)) {
      const reasons: Record<string, string> = {
        '大魔国': '大魔国隐于洞天之中，无传送阵可通达',
        '东瀛': '东瀛被古老结界封锁，无法传送',
        '阴曹地府': '阴曹地府为冥界，需特殊通道进入',
      };
      return { available: false, reason: reasons[name] || `${name}无法传送` };
    }
    return { available: true, reason: '' };
  }

  return { available: true, reason: '' };
}

/** 检查出发地是否有传送阵 */
const canTeleportFromCurrent = computed(() => {
  const d = store.data;
  if (!d.大区域) return { available: false, reason: '未知当前位置' };
  if (NO_TELEPORT_REGIONS.has(d.大区域)) return { available: false, reason: `${d.大区域}无传送阵` };

  // 有具体地点时，检查该地点
  if (d.具体地点) {
    if (TELEPORT_LOCATIONS.has(d.具体地点)) return { available: true, reason: '' };
    if (SECT_LOCATIONS.has(d.具体地点)) return { available: false, reason: `${d.具体地点}没有公共传送阵` };
    return { available: false, reason: `${d.具体地点}没有传送阵，需先前往附近城镇` };
  }

  // 有子区域但无具体地点
  if (d.子区域) {
    if (TELEPORT_LOCATIONS.has(d.子区域)) return { available: true, reason: '' };
  }

  return { available: true, reason: '' };
});

// ─── 传送阵费用计算 ───
const teleportAvailability = computed(() => {
  if (!selectedMarker.value) return { available: false, reason: '未选择目的地' };

  // 先检查出发地
  if (!canTeleportFromCurrent.value.available) {
    return canTeleportFromCurrent.value;
  }

  // 再检查目的地
  return getTeleportAvailability(selectedMarker.value);
});

const teleportCost = computed(() => {
  if (!selectedMarker.value) return 0;
  if (!teleportAvailability.value.available) return 0;

  const marker = selectedMarker.value;
  const d = store.data;

  const fromRegion = d.大区域;
  const toRegion = marker.所属区域 || marker.名称;
  const fromSub = d.子区域;
  const toSub = marker.所属子区域 || marker.名称;

  if (!fromRegion || !toRegion) return TELEPORT_DIAGONAL;

  // 同一大区域
  if (fromRegion === toRegion) {
    if (fromSub === toSub) return TELEPORT_BASE_COST;
    return TELEPORT_CROSS_SUB;
  }

  // 跨大区域：根据距离等级
  const dist = REGION_DISTANCE[fromRegion]?.[toRegion] ?? 3;
  if (dist === 1) return TELEPORT_ADJACENT;
  if (dist === 2) return TELEPORT_FAR;
  return TELEPORT_DIAGONAL;
});

const canAffordTeleport = computed(() => {
  if (!teleportAvailability.value.available) return false;
  return store.灵石总量 >= teleportCost.value;
});

const teleportCostNote = computed(() => {
  if (!selectedMarker.value) return '';

  // 如果不可传送，显示原因
  if (!teleportAvailability.value.available) {
    return teleportAvailability.value.reason;
  }

  const marker = selectedMarker.value;
  const d = store.data;
  const fromRegion = d.大区域;
  const toRegion = marker.所属区域 || marker.名称;

  if (fromRegion === toRegion) {
    const fromSub = d.子区域;
    const toSub = marker.所属子区域 || marker.名称;
    if (fromSub === toSub) return '同区域短距传送';
    return `跨区传送（${fromSub || '未知'} → ${toSub}）`;
  }

  const dist = REGION_DISTANCE[fromRegion]?.[toRegion] ?? 3;
  const distDesc = dist === 1 ? '相邻' : dist === 2 ? '较远' : '遥远';
  return `跨洲${distDesc}传送（${fromRegion || '未知'} → ${toRegion}）`;
});

// 是否跨区域移动
const isCrossRegionTravel = computed(() => {
  if (!selectedMarker.value) return false;
  const marker = selectedMarker.value;
  const fromRegion = store.data.大区域;
  const toRegion = marker.所属区域 || marker.名称;
  return fromRegion !== toRegion && !!fromRegion && !!toRegion;
});

// ─── 构建目标位置描述 ───
function buildToDesc(marker: 地图标记): string {
  if (marker.层级 === '一层') return marker.名称;
  if (marker.层级 === '二层') return `${marker.所属区域 || ''}·${marker.名称}`;
  return `${marker.所属区域 || ''}·${marker.所属子区域 || ''}·${marker.名称}`;
}

// ─── 发送预览内容 ───
const travelPreviewContent = computed(() => {
  if (!selectedMarker.value) return '';
  const marker = selectedMarker.value;
  const method = travelMethod.value;
  const from = currentLocation.value || '未知位置';
  const toDesc = buildToDesc(marker);

  let content = `【${method}】\n\n`;

  if (method === '传送阵') {
    // 不写费用金额，避免AI二次扣费
    content += `{{user}}前往传送大阵，从${from}传送至${toDesc}。`;
  } else {
    const verbMap: Record<string, string> = {
      '御剑飞行': '御剑升空，朝',
      '御空飞行': '御空飞行，朝',
      '步行': '步行出发，前往',
      '骑乘': '骑乘坐骑，前往',
      '乘船': '登船出发，前往',
    };
    content += `{{user}}${verbMap[method] || '前往'}${toDesc}。`;
  }

  if (travelMessage.value?.trim()) {
    content += `\n\n${travelMessage.value.trim()}`;
  }

  return content;
});

const fishingInfo = computed(() => {
  if (!selectedMarker.value) return null;
  // 优先使用标记点自己的钓鱼信息
  if (selectedMarker.value.钓鱼信息) return selectedMarker.value.钓鱼信息;
  // 否则尝试从钓鱼信息表获取
  return getFishingInfo(selectedMarker.value.名称) || getFishingInfo(selectedMarker.value.所属子区域 || '') || getFishingInfo(selectedMarker.value.所属区域 || '');
});


// ─── 方法 ───
function getLocationTypeName(type: string): string {
  const map: Record<string, string> = {
    '大区域': '大区域',
    '子区域': '子区域',
    '具体地点': '地点',
    '势力': '势力',
    '宗门': '宗门',
    '城市': '城市',
    '特殊地点': '特殊',
  };
  return map[type] || type;
}

function getFactionColor(faction: string): string {
  const map: Record<string, string> = {
    '正道': '#10b981',
    '邪道': '#ef4444',
    '魔道': '#a855f7',
    '中立': '#6b7280',
    '混乱中立': '#f59e0b',
    '妖族': '#22c55e',
    '佛门': '#eab308',
    '海域': '#3b82f6',
    '冥界': '#6366f1',
  };
  return map[faction] || '#8b5cf6';
}

function isCurrentLocation(marker: 地图标记): boolean {
  const name = marker.名称;
  const d = store.data;
  // 根据层级精确判断
  if (marker.层级 === '三层') return name === d.具体地点;
  if (marker.层级 === '二层') return name === d.子区域;
  if (marker.层级 === '一层') return name === d.大区域;
  return false;
}

// 地图操作
const mapImageRef = ref<HTMLImageElement | null>(null);

function onMapImageLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  mapImageRef.value = img;
  fitImageToContainer();
}

function fitImageToContainer() {
  const container = mapContainerRef.value;
  const img = mapImageRef.value;
  if (!container || !img) return;

  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // 计算适应容器的缩放比例
  const fitScale = Math.min(cw / iw, ch / ih);

  // 设置图片显示尺寸
  img.style.width = iw + 'px';
  img.style.height = ih + 'px';

  // 设置初始 zoom 使图片刚好装进容器
  baseZoom.value = fitScale;
  zoom.value = fitScale;

  // 居中显示
  panX.value = (cw - iw * fitScale) / 2;
  panY.value = (ch - ih * fitScale) / 2;
}

function zoomAtPoint(newZoom: number, clientX: number, clientY: number) {
  const container = mapContainerRef.value;
  if (!container) {
    zoom.value = newZoom;
    return;
  }

  const rect = container.getBoundingClientRect();
  // 鼠标在容器内的位置
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  const oldZoom = zoom.value;

  // 缩放前鼠标指向的世界坐标: worldX = (mouseX - panX) / oldZoom
  // 缩放后要求同一世界坐标仍在鼠标位置: mouseX = worldX * newZoom + newPanX
  // => newPanX = mouseX - (mouseX - panX) / oldZoom * newZoom
  panX.value = mouseX - ((mouseX - panX.value) / oldZoom) * newZoom;
  panY.value = mouseY - ((mouseY - panY.value) / oldZoom) * newZoom;

  zoom.value = newZoom;
}

function zoomIn() {
  const container = mapContainerRef.value;
  if (container) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomAtPoint(Math.min(5, zoom.value * 1.25), centerX, centerY);
  } else {
    zoom.value = Math.min(5, zoom.value * 1.25);
  }
}

function zoomOut() {
  const container = mapContainerRef.value;
  if (container) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomAtPoint(Math.max(0.1, zoom.value / 1.25), centerX, centerY);
  } else {
    zoom.value = Math.max(0.1, zoom.value / 1.25);
  }
}

function resetView() {
  fitImageToContainer();
}

let lastX = 0;
let lastY = 0;
let dragMoved = false;

function onMapMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  isDragging.value = true;
  dragMoved = false;
  lastX = e.clientX;
  lastY = e.clientY;

  const doc = window.parent?.document || document;

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
    panX.value += dx;
    panY.value += dy;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onMouseUp = () => {
    isDragging.value = false;
    doc.removeEventListener('mousemove', onMouseMove);
    doc.removeEventListener('mouseup', onMouseUp);
  };

  doc.addEventListener('mousemove', onMouseMove);
  doc.addEventListener('mouseup', onMouseUp);
}

// 触摸支持
let lastTouchX = 0;
let lastTouchY = 0;
let lastTouchDist = 0;

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging.value = true;
    dragMoved = false;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }

  const doc = window.parent?.document || document;

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && isDragging.value) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      panX.value += dx;
      panY.value += dy;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDist > 0) {
        const scale = dist / lastTouchDist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const newZoom = Math.max(0.5, Math.min(3, zoom.value * scale));
        zoomAtPoint(newZoom, midX, midY);
      }
      lastTouchDist = dist;
    }
  };

  const onTouchEnd = () => {
    isDragging.value = false;
    lastTouchDist = 0;
    doc.removeEventListener('touchmove', onTouchMove as EventListener);
    doc.removeEventListener('touchend', onTouchEnd);
  };

  doc.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
  doc.addEventListener('touchend', onTouchEnd);
}

function onMapWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.15 : 0.15;
  const newZoom = Math.max(0.5, Math.min(3, zoom.value + delta));
  zoomAtPoint(newZoom, e.clientX, e.clientY);
}

// 标点点击
function onMarkerClick(marker: 地图标记) {
  if (dragMoved) return; // 拖拽后不触发点击
  selectedMarker.value = marker;
}

// 导航操作
function startNavigation() {
  if (!selectedMarker.value) return;
  travelMethod.value = '御空飞行'; // 重置默认方式
  travelMessage.value = '';
  locationSet.value = false; // 重置位置设置状态
  showTravelConfirm.value = true;
}

function expandSubRegion() {
  if (!selectedMarker.value) return;
  drillDown(selectedMarker.value);
  selectedMarker.value = null;
}

// 判断是否可以展开子区域（用于显示进入区域按钮）
function canExpandSubRegion(marker: 地图标记 | null): boolean {
  if (!marker) return false;
  if (!marker.子区域 || marker.子区域.length === 0) return false;

  // 一层标记：有子区域就可以进入二层
  if (marker.层级 === '一层') return true;

  // 二层标记：需要有三层数据才能进入
  if (marker.层级 === '二层') {
    const subMarkers = getMarkersBySubRegion(marker.名称);
    return subMarkers.length > 0;
  }

  return false;
}

function drillDown(marker: 地图标记) {
  if (marker.层级 === '一层' && marker.子区域 && marker.子区域.length > 0) {
    // 进入二层
    currentLayer.value = '二层';
    currentRegion.value = marker.名称;
    currentSubRegion.value = null;
    breadcrumbs.value = ['阴阳大陆', marker.名称];
    resetView();
  } else if (marker.层级 === '二层' && marker.子区域 && marker.子区域.length > 0) {
    // 检查是否有三层标记数据
    const subMarkers = getMarkersBySubRegion(marker.名称);
    if (subMarkers.length > 0) {
      currentLayer.value = '三层';
      currentSubRegion.value = marker.名称;
      breadcrumbs.value = [...breadcrumbs.value.slice(0, 2), marker.名称];
      resetView();
    }
  }
}


// 第三层卡片点击：显示详情面板
function onLayer3CardClick(marker: 地图标记) {
  selectedMarker.value = marker;
}

// 第三层卡片前往操作：打开移动确认弹窗
function setLayer3AsLocation(marker: 地图标记) {
  selectedMarker.value = marker;
  travelMethod.value = '御空飞行';
  travelMessage.value = '';
  locationSet.value = false; // 重置位置设置状态
  showTravelConfirm.value = true;
}

function navigateTo(index: number) {
  if (index === 0) {
    // 返回一层
    currentLayer.value = '一层';
    currentRegion.value = null;
    currentSubRegion.value = null;
    breadcrumbs.value = ['阴阳大陆'];
  } else if (index === 1 && breadcrumbs.value.length > 1) {
    // 返回二层
    currentLayer.value = '二层';
    currentSubRegion.value = null;
    breadcrumbs.value = breadcrumbs.value.slice(0, 2);
    currentRegion.value = breadcrumbs.value[1];
  }
  // index === 2 时已经在三层，不需要操作
  resetView();
}

/** 步骤1：设置当前位置变量（先修改变量让 EJS 激活） */
async function setLocationVariables() {
  if (!selectedMarker.value) return;

  const marker = selectedMarker.value;
  const d = store.data;

  // 根据标记层级设置位置变量
  if (marker.层级 === '一层') {
    d.大区域 = marker.名称;
    d.子区域 = '';
    d.具体地点 = '';
  } else if (marker.层级 === '二层') {
    d.大区域 = marker.所属区域 || d.大区域;
    d.子区域 = marker.名称;
    d.具体地点 = '';
  } else {
    // 三层
    d.大区域 = marker.所属区域 || d.大区域;
    d.子区域 = marker.所属子区域 || d.子区域;
    d.具体地点 = marker.名称;
  }

  await store.saveData();
  locationSet.value = true;
  toastr.success(`位置已设置为：${buildToDesc(marker)}`, '位置更新');
}

/** 步骤2：确认前往（发送消息触发 AI 回复） */
async function confirmTravel() {
  if (!selectedMarker.value || !locationSet.value) return;

  const marker = selectedMarker.value;
  const method = travelMethod.value;
  const cost = teleportCost.value;

  // ── 传送阵：验证并扣灵石 ──
  if (method === '传送阵') {
    if (!teleportAvailability.value.available) {
      toastr.error(teleportAvailability.value.reason);
      return;
    }
    if (!canAffordTeleport.value) {
      toastr.error('灵石不足，无法使用传送阵');
      return;
    }

    // 扣除灵石（优先扣下品，不足则折算）
    await deductSpiritStones(cost);
  }

  // ── 生成移动描述并发送给酒馆 ──
  // 位置变量已在步骤1中设置，EJS 条目已激活
  const content = travelPreviewContent.value;

  // 先关闭弹窗UI
  showTravelConfirm.value = false;
  selectedMarker.value = null;
  travelMessage.value = '';
  locationSet.value = false;

  // 发送并触发AI回复
  triggerSlash('/send ' + content + ' | /trigger');

  // 延迟关闭状态栏面板，确保triggerSlash完成
  setTimeout(() => { store.isOpen = false; }, 300);

  if (method === '传送阵') {
    toastr.success(`已扣除 ${cost} 下品灵石，等待传送完成...`);
  } else {
    toastr.success(`正在前往${marker.名称}...`);
  }
}

/** 扣除灵石（折算为下品灵石计算） */
async function deductSpiritStones(cost: number) {
  let remaining = cost;
  const d = store.data;

  // 优先扣下品灵石
  if (d.下品灵石 >= remaining) {
    d.下品灵石 -= remaining;
    remaining = 0;
  } else {
    remaining -= d.下品灵石;
    d.下品灵石 = 0;
  }

  // 不足则扣中品灵石（1中品 = 1000下品）
  if (remaining > 0 && d.中品灵石 > 0) {
    const needMid = Math.ceil(remaining / 1000);
    const useMid = Math.min(needMid, d.中品灵石);
    d.中品灵石 -= useMid;
    // 找零
    const change = useMid * 1000 - remaining;
    if (change > 0) d.下品灵石 += change;
    remaining = Math.max(0, remaining - useMid * 1000);
  }

  // 不足则扣上品灵石（1上品 = 1000000下品）
  if (remaining > 0 && d.上品灵石 > 0) {
    const needHigh = Math.ceil(remaining / 1000000);
    const useHigh = Math.min(needHigh, d.上品灵石);
    d.上品灵石 -= useHigh;
    const change = useHigh * 1000000 - remaining;
    if (change > 0) d.下品灵石 += change;
    remaining = Math.max(0, remaining - useHigh * 1000000);
  }

  // 不足则扣极品灵石（1极品 = 1000000000下品）
  if (remaining > 0 && d.极品灵石 > 0) {
    const needTop = Math.ceil(remaining / 1000000000);
    const useTop = Math.min(needTop, d.极品灵石);
    d.极品灵石 -= useTop;
    const change = useTop * 1000000000 - remaining;
    if (change > 0) d.下品灵石 += change;
    remaining = 0;
  }

  await store.saveData();
}

// 监听地图切换时重置视图
watch([currentLayer, currentRegion], () => {
  // 地图切换后，等图片加载会自动调用 fitImageToContainer
  // 但如果图片已缓存、load不再触发，则手动重置
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
  selectedMarker.value = null;
});

// 初始化
onMounted(() => {
  // 从当前变量设置初始显示
  const d = store.data;
  if (d.大区域) {
    currentRegion.value = d.大区域;
    currentLayer.value = '二层';
    breadcrumbs.value = ['阴阳大陆', d.大区域];
  }
});
</script>

<style scoped>
.tab-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0a0a1a;
  color: #e0d5c0;
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: rgba(20, 20, 40, 0.8);
  border-bottom: 1px solid rgba(200, 180, 140, 0.2);
  gap: 4px;
}

.crumb {
  background: none;
  border: none;
  color: #8a7e6a;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.crumb:hover {
  background: rgba(200, 180, 140, 0.1);
  color: #e0d5c0;
}

.crumb.active {
  color: #c8b48c;
  font-weight: 600;
}

.crumb-sep {
  margin-right: 4px;
  opacity: 0.5;
}

/* 地图容器 */
.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}

.map-container.dragging {
  cursor: grabbing;
}

.map-world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  transition: transform 0.15s ease-out;
}

.map-world.no-transition {
  transition: none !important;
}

.map-image {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  bottom: 60px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 100;
}

.ctrl-btn {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: rgba(20, 20, 40, 0.85);
  color: #c8b48c;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.ctrl-btn svg {
  width: 22px;
  height: 22px;
}

.ctrl-btn:hover {
  background: rgba(60, 50, 30, 0.9);
  border-color: #c8b48c;
}

.ctrl-btn.active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8b5cf6;
  color: #a78bfa;
}

/* 当前位置指示 */
.current-location {
  position: absolute;
  bottom: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(20, 20, 40, 0.85);
  border: 1px solid rgba(200, 180, 140, 0.3);
  border-radius: 20px;
  font-size: 12px;
  color: #c8b48c;
  backdrop-filter: blur(8px);
  z-index: 100;
}

.current-location svg {
  color: #10b981;
}

/* 地图标记点 */
.marker {
  position: absolute;
  cursor: pointer;
  z-index: 10;
  transition: filter 0.15s;
}

.marker:hover {
  filter: brightness(1.4);
  z-index: 20;
}

.marker-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 10px var(--marker-color, #8b5cf6), 0 2px 6px rgba(0,0,0,0.3);
  transition: all 0.2s;
}

.marker:hover .marker-dot {
  transform: scale(1.2);
  box-shadow: 0 0 16px var(--marker-color, #8b5cf6), 0 4px 12px rgba(0,0,0,0.4);
}

.marker-tiny .marker-dot {
  width: 14px;
  height: 14px;
}

.marker-small .marker-dot {
  width: 16px;
  height: 16px;
}

.marker-large .marker-dot {
  width: 24px;
  height: 24px;
  animation: pulse 2.5s ease-out infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(1); opacity: 0.9; }
}

.marker-label {
  position: absolute;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  color: var(--marker-color, #c8b48c);
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  user-select: none;
  padding: 4px 8px;
  background: rgba(10, 10, 30, 0.85);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.marker:hover .marker-label {
  background: rgba(20, 20, 50, 0.95);
}

.label-above {
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
}

.label-below {
  left: 50%;
  top: calc(100% + 10px);
  transform: translateX(-50%);
}

.label-left {
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
}

.label-right {
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
}

/* ─── 第三层：文字列表视图 ─── */
.layer3-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(10, 10, 30, 0.6);
}

.layer3-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(200, 180, 140, 0.15);
  background: rgba(20, 20, 40, 0.5);
}

.layer3-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #f0e6d0;
}

.layer3-title svg {
  color: #8b5cf6;
}

.layer3-subtitle {
  font-size: 12px;
  color: #8a7e6a;
  margin-top: 4px;
  padding-left: 24px;
}

.layer3-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer3-card {
  display: flex;
  align-items: stretch;
  background: rgba(20, 20, 40, 0.8);
  border: 1px solid rgba(200, 180, 140, 0.2);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.layer3-card:hover {
  background: rgba(30, 30, 60, 0.85);
  border-color: rgba(200, 180, 140, 0.4);
  transform: translateY(-1px);
}

.layer3-card.is-current {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(139, 92, 246, 0.1);
}

.card-color-bar {
  width: 4px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-name {
  font-size: 15px;
  font-weight: 700;
}

.card-type {
  font-size: 10px;
  color: #8a7e6a;
  background: rgba(200, 180, 140, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(200, 180, 140, 0.2);
}

.card-current-badge {
  font-size: 10px;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.card-faction {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #a09880;
}

.faction-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.card-desc {
  font-size: 12px;
  color: #8a7e6a;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-characters {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  flex-wrap: wrap;
}

.card-characters svg {
  color: #8b5cf6;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  padding: 12px;
  flex-shrink: 0;
  border-left: 1px solid rgba(200, 180, 140, 0.1);
}

.card-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border: none;
}

.card-action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
}

.card-action-btn.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.card-action-btn.active {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  cursor: default;
}

/* 第三层滚动条 */
.layer3-list::-webkit-scrollbar {
  width: 4px;
}

.layer3-list::-webkit-scrollbar-track {
  background: transparent;
}

.layer3-list::-webkit-scrollbar-thumb {
  background: rgba(200, 180, 140, 0.3);
  border-radius: 2px;
}

/* 路线 */
.map-routes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 地点详情面板 */
.location-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 340px;
  max-height: 100%;
  background: rgba(15, 15, 35, 0.95);
  border-left: 1px solid rgba(200, 180, 140, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 200;
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid rgba(200, 180, 140, 0.15);
}

.panel-title {
  flex: 1;
}

.location-type {
  font-size: 10px;
  color: #8a7e6a;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-title h3 {
  font-size: 18px;
  color: #f0e6d0;
  margin: 4px 0 0;
  font-weight: 600;
}

.panel-close {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: transparent;
  color: #8a7e6a;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.panel-close:hover {
  background: rgba(200, 180, 140, 0.1);
  color: #f0e6d0;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-section p {
  font-size: 13px;
  line-height: 1.7;
  color: #a09880;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #c8b48c;
  font-weight: 600;
}

.section-label svg {
  color: #c8b48c;
}

.faction-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.character-item {
  padding: 6px 12px;
  background: rgba(200, 180, 140, 0.1);
  border: 1px solid rgba(200, 180, 140, 0.2);
  border-radius: 16px;
  font-size: 12px;
  color: #c8b48c;
}

.fishing-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fishing-line {
  font-size: 12px;
  color: #60a0c0;
  line-height: 1.5;
  padding: 4px 8px;
  background: rgba(96, 160, 192, 0.1);
  border-radius: 4px;
}

/* 操作按钮 */
.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(200, 180, 140, 0.15);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  color: #fff;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.action-btn.secondary {
  background: rgba(200, 180, 140, 0.1);
  border: 1px solid rgba(200, 180, 140, 0.3);
  color: #c8b48c;
}

.action-btn.secondary:hover {
  background: rgba(200, 180, 140, 0.2);
  border-color: #c8b48c;
}

/* 移动确认弹窗 */
.travel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.travel-modal {
  width: 480px;
  max-width: 95%;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(200, 180, 140, 0.3);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(16px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(200, 180, 140, 0.2);
}

.modal-header h3 {
  font-size: 16px;
  color: #f0e6d0;
  margin: 0;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #8a7e6a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(200, 180, 140, 0.1);
  color: #f0e6d0;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 路线显示 */
.travel-route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: rgba(200, 180, 140, 0.05);
  border-radius: 12px;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-point.from .route-icon {
  color: #8a7e6a;
}

.route-point.to .route-icon {
  color: #10b981;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.route-label {
  font-size: 10px;
  color: #8a7e6a;
  text-transform: uppercase;
}

.route-name {
  font-size: 14px;
  color: #f0e6d0;
  font-weight: 600;
}

.route-arrow {
  color: #c8b48c;
}

/* 移动选项 */
.travel-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row label {
  font-size: 12px;
  color: #c8b48c;
  font-weight: 600;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-buttons button {
  padding: 6px 12px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: rgba(200, 180, 140, 0.05);
  color: #a09880;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-buttons button:hover {
  border-color: #c8b48c;
  color: #c8b48c;
}

.option-buttons button.active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  color: #a78bfa;
}

.option-row input {
  padding: 8px 12px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: rgba(200, 180, 140, 0.05);
  border-radius: 6px;
  font-size: 13px;
  color: #f0e6d0;
}

.option-row input:focus {
  outline: none;
  border-color: #8b5cf6;
}

/* 移动描述 */
.travel-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.travel-message label {
  font-size: 12px;
  color: #c8b48c;
  font-weight: 600;
}

.travel-message textarea {
  padding: 10px 12px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: rgba(200, 180, 140, 0.05);
  border-radius: 8px;
  font-size: 13px;
  color: #f0e6d0;
  resize: none;
  font-family: inherit;
}

.travel-message textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(200, 180, 140, 0.2);
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid rgba(200, 180, 140, 0.3);
  background: transparent;
  color: #a09880;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #c8b48c;
  color: #c8b48c;
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-confirm:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 设置当前位置按钮 */
.btn-set-location {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-set-location:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
  transform: translateY(-1px);
}

.btn-set-location.done {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
  cursor: default;
  opacity: 0.8;
}

/* ─── 传送阵费用区域 ─── */
.teleport-cost-section {
  margin-top: 4px;
}

.cost-info {
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-info.insufficient {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.cost-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
}

.cost-info.insufficient .cost-header {
  color: #f87171;
}

.cost-detail {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.cost-amount {
  font-size: 16px;
  font-weight: 800;
  color: #f0e6d0;
}

.cost-balance {
  font-size: 11px;
  color: #8a7e6a;
}

.cost-warning {
  font-size: 12px;
  color: #f87171;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.cost-note {
  font-size: 11px;
  color: #8a7e6a;
  font-style: italic;
}

/* ─── 跨区域提示 ─── */
.cross-region-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: #fbbf24;
}

/* ─── 预览框 ─── */
.preview-box {
  background: rgba(200, 180, 140, 0.08);
  border: 1px solid rgba(200, 180, 140, 0.2);
  border-radius: 10px;
  padding: 12px;
}

.preview-label {
  font-size: 10px;
  font-weight: 700;
  color: #c8b48c;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  font-size: 12px;
  color: #a09880;
  line-height: 1.7;
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
}

.preview-content::-webkit-scrollbar {
  width: 3px;
}

.preview-content::-webkit-scrollbar-thumb {
  background: rgba(200, 180, 140, 0.3);
  border-radius: 2px;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条 */
.panel-body::-webkit-scrollbar {
  width: 4px;
}

.panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(200, 180, 140, 0.3);
  border-radius: 2px;
}

/* ─── 手机端适配 ─── */
@media (max-width: 500px) {
  /* 地点详情面板：底部弹出 sheet */
  .location-panel {
    position: absolute;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100% !important;
    max-height: 55%;
    border-radius: 14px 14px 0 0;
    border-left: none;
    border-top: 1px solid rgba(200, 180, 140, 0.3);
    overflow: hidden;
  }

  .location-panel .panel-header {
    flex-shrink: 0;
    padding: 12px 14px;
  }

  .location-panel .panel-body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 0;
    padding: 12px;
  }

  .location-panel .panel-actions {
    position: sticky;
    bottom: 0;
    background: rgba(15, 15, 35, 0.98);
    padding: 10px 14px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    margin: 0 -12px -12px;
    border-top: 1px solid rgba(200, 180, 140, 0.2);
    z-index: 10;
  }

  /* 移动确认弹窗：底部 sheet 样式，使用 absolute 相对于面板 */
  .travel-overlay {
    position: absolute;
    align-items: flex-end;
  }

  .travel-modal {
    width: 100%;
    max-width: 100%;
    max-height: 85%;
    border-radius: 14px 14px 0 0;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .travel-modal .modal-header {
    padding: 12px 16px;
  }

  .travel-modal .modal-body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 14px;
    gap: 14px;
  }

  .travel-modal .modal-footer {
    flex-shrink: 0;
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  /* 路线显示紧凑化 */
  .travel-route {
    padding: 12px;
    gap: 10px;
    flex-direction: column;
  }

  .route-arrow {
    transform: rotate(0deg);
  }

  .route-point {
    flex-direction: row;
    width: 100%;
  }

  /* 面包屑导航 */
  .breadcrumb {
    padding: 8px 10px;
  }

  .crumb {
    font-size: 12px;
    padding: 4px 8px;
  }

  /* 第三层列表 */
  .layer3-header {
    padding: 10px 12px;
  }

  .layer3-title {
    font-size: 14px;
  }

  .layer3-list {
    padding: 8px;
    gap: 8px;
  }

  .card-name {
    font-size: 13px;
  }

  .card-desc {
    font-size: 11px;
    line-clamp: 1;
    -webkit-line-clamp: 1;
  }

  .card-action-btn {
    padding: 6px 10px;
    font-size: 11px;
  }

  /* 地图控制按钮 */
  .ctrl-btn {
    width: 38px;
    height: 38px;
  }

  .ctrl-btn svg {
    width: 18px;
    height: 18px;
  }

  .map-controls {
    bottom: 50px;
    right: 8px;
    gap: 4px;
  }

  /* 当前位置指示 */
  .current-location {
    bottom: 10px;
    left: 10px;
    font-size: 11px;
    padding: 6px 10px;
  }

  /* 标记点标签 */
  .marker-label {
    font-size: 11px;
    padding: 2px 6px;
  }

  .marker-dot {
    width: 14px;
    height: 14px;
  }

  .marker-small .marker-dot {
    width: 12px;
    height: 12px;
  }

  .marker-large .marker-dot {
    width: 18px;
    height: 18px;
  }
}
</style>
