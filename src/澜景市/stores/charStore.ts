import { defineStore } from 'pinia';
import { computed } from 'vue';
import { getCharsAtLocation } from '../engine/charPresence';
import { useLanjingGameStore } from './gameStore';

export const useLanjingCharStore = defineStore('lanjing-char', () => {
  const game = useLanjingGameStore();
  const chars = computed(() => Object.values(game.save.chars));
  const presentChars = computed(() => getCharsAtLocation(game.save, game.save.user.currentLocationId));

  return { chars, presentChars };
});
