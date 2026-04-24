/** 内置弹窗 composable，替代 hostWindow.prompt/confirm */
export function useModal() {
  const visible = ref(false);
  const title = ref('');
  const message = ref('');
  const mode = ref<'confirm' | 'prompt'>('confirm');
  const defaultValue = ref('');

  let _resolve: ((value: string | true | null) => void) | null = null;

  function showPrompt(promptTitle: string, promptDefault = ''): Promise<string | null> {
    title.value = promptTitle;
    message.value = '';
    mode.value = 'prompt';
    defaultValue.value = promptDefault;
    visible.value = true;
    return new Promise(resolve => {
      _resolve = resolve as (value: string | true | null) => void;
    });
  }

  function showConfirm(confirmTitle: string, confirmMessage = ''): Promise<boolean> {
    title.value = confirmTitle;
    message.value = confirmMessage;
    mode.value = 'confirm';
    defaultValue.value = '';
    visible.value = true;
    return new Promise(resolve => {
      _resolve = (val) => resolve(val !== null);
    });
  }

  function onConfirm(value: string | true) {
    visible.value = false;
    _resolve?.(value);
    _resolve = null;
  }

  function onCancel() {
    visible.value = false;
    _resolve?.(null);
    _resolve = null;
  }

  return {
    visible,
    title,
    message,
    mode,
    defaultValue,
    showPrompt,
    showConfirm,
    onConfirm,
    onCancel,
  };
}
