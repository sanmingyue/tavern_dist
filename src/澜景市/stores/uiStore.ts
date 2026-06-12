import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLanjingUiStore = defineStore('lanjing-ui', () => {
  const isOpen = ref(false);
  const busy = ref(false);
  const lastMessage = ref('');
  const lastError = ref('');

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  function info(message: string): void {
    lastMessage.value = message;
    lastError.value = '';
  }

  function error(message: string): void {
    lastError.value = message;
  }

  return { isOpen, busy, lastMessage, lastError, toggle, info, error };
});
