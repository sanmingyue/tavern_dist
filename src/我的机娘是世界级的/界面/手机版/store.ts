import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

/** MVU 变量数据 store */
export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });

/** UI 状态 store */
export const useUIStore = defineStore('mech-ui-mobile', () => {
  const currentView = ref<'story' | 'game'>('story');
  const activeTab = ref('home');

  function toggleView() {
    currentView.value = currentView.value === 'story' ? 'game' : 'story';
  }

  function setTab(name: string) {
    activeTab.value = name;
  }

  return { currentView, activeTab, toggleView, setTab };
});
