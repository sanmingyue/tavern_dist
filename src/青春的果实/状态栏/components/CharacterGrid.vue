<template>
  <div class="fruit-grid">
    <div
      v-for="char in characters"
      :key="char.name"
      class="fruit-grid__card"
      :style="cardBgStyle(char)"
      @click="$emit('select', char.name)"
    >
      <!-- 角色名 + 关系状态 -->
      <div class="fruit-grid__header">
        <span class="fruit-grid__name">{{ char.name }}</span>
        <span class="fruit-grid__relation" :class="'fruit-grid__relation--' + relationKey(char.relation)">
          {{ char.relation }}
        </span>
      </div>

      <!-- 好感度进度条 -->
      <div class="fruit-grid__bar-track">
        <div
          class="fruit-grid__bar-fill"
          :style="{ width: progressWidth(char.favor), background: progressColor(char.favor) }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore, CHARACTER_LIST } from '../store';
import { getCharacterVisuals, type CharacterVisualStage } from '../visuals';

defineEmits<{ select: [name: string] }>();

const store = useStatusStore();

const characters = computed(() =>
  CHARACTER_LIST.map(meta => {
    const data = store.getCharacter(meta.name);
    return {
      name: meta.name,
      favor: data.好感度,
      relation: data.关系状态,
      color: meta.color,
      visuals: getCharacterVisuals(meta, data),
    };
  }),
);

function cardBgStyle(char: {
  color: string;
  visuals: { background: string; fallback: string; border: string; glow: string; stage: CharacterVisualStage };
}): Record<string, string> {
  return {
    backgroundColor: char.color,
    backgroundImage: `linear-gradient(90deg, rgba(10, 10, 20, 0.96) 0%, rgba(10, 10, 20, 0.82) 54%, rgba(10, 10, 20, 0.42) 100%), url("${char.visuals.background}"), url("${char.visuals.fallback}")`,
    backgroundPosition: 'center right',
    backgroundSize: 'cover',
    borderColor: char.visuals.border,
    boxShadow: char.visuals.stage === 'normal' ? 'none' : `0 0 18px ${char.visuals.glow}`,
  };
}

function progressWidth(favor: number): string {
  const normalized = Math.max(0, Math.min(100, ((favor + 100) / 200) * 100));
  return `${normalized}%`;
}

function progressColor(favor: number): string {
  const t = Math.max(0, Math.min(1, (favor + 100) / 200));
  const hue = 210 + t * 120;
  const lightness = 60 + t * 5;
  return `hsl(${hue}, 80%, ${lightness}%)`;
}

function relationKey(relation: string): string {
  switch (relation) {
    case '恋人': return 'lover';
    case '暧昧': return 'ambiguous';
    case '熟悉': return 'familiar';
    case '决裂': case '封心': case '疏远': return 'broken';
    default: return 'default';
  }
}
</script>

<style scoped>
.fruit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.fruit-grid::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.fruit-grid__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.fruit-grid__card:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.fruit-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fruit-grid__name {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.fruit-grid__relation {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
}

.fruit-grid__relation--lover {
  background: rgba(236, 72, 153, 0.2);
  color: rgba(249, 168, 212, 1);
}

.fruit-grid__relation--ambiguous {
  background: rgba(168, 85, 247, 0.2);
  color: rgba(196, 181, 253, 1);
}

.fruit-grid__relation--familiar {
  background: rgba(59, 130, 246, 0.2);
  color: rgba(147, 197, 253, 1);
}

.fruit-grid__relation--broken {
  background: rgba(239, 68, 68, 0.2);
  color: rgba(252, 165, 165, 1);
}

.fruit-grid__bar-track {
  height: 6px;
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.fruit-grid__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}
</style>
