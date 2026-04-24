import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

/** MVU 变量数据 store */
export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });

/** UI 状态 store */
export const useUIStore = defineStore('mech-ui', () => {
  const currentView = ref<'story' | 'game'>('story');
  const activePanel = ref('overview');

  function toggleView() {
    currentView.value = currentView.value === 'story' ? 'game' : 'story';
  }

  function setPanel(name: string) {
    activePanel.value = name;
  }

  return { currentView, activePanel, toggleView, setPanel };
});
