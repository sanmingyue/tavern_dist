import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { dispatchGameAction } from '../services/actionService';
import { syncPhoneActions, syncPhoneContacts } from '../services/phoneSync';
import { ensureSave, loadSave, resetSave, writeSave } from '../services/saveService';
import type { GameAction } from '../types/actions';
import type { GameSave } from '../types/schema';

export const useLanjingGameStore = defineStore('lanjing-game', () => {
  const save = ref<GameSave>(ensureSave());
  const loaded = ref(false);

  const locationId = computed(() => save.value.user.currentLocationId);
  const money = computed(() => save.value.assets.money);
  const currentTime = computed(() => save.value.time.current);
  const gameStarted = computed(() => save.value.gameStarted);

  function load(): void {
    const result = loadSave();
    save.value = result.save;
    loaded.value = true;
    if (result.created || result.migrated || result.errors.length > 0) {
      writeSave(save.value);
    }
  }

  function persist(): void {
    writeSave(save.value);
  }

  function reset(): void {
    save.value = resetSave();
    loaded.value = true;
  }

  function dispatch(action: GameAction): ReturnType<typeof dispatchGameAction> {
    return dispatchGameAction(save.value, action);
  }

  function tick(): void {
    dispatch({ type: 'TICK_NOW' });
  }

  function syncPhone(): { actions: number; contacts: number } {
    const actions = syncPhoneActions(save.value).length;
    const contacts = syncPhoneContacts(save.value);
    persist();
    return { actions, contacts };
  }

  load();

  return {
    save,
    loaded,
    locationId,
    money,
    currentTime,
    gameStarted,
    load,
    persist,
    reset,
    dispatch,
    tick,
    syncPhone,
  };
});
