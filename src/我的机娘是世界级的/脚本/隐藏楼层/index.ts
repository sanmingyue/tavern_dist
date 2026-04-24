$(() => {
  // 隐藏除最后一条之外的所有消息楼层
  $('#chat > .mes').not('.last_mes').remove();

  // 隐藏酒馆原生输入栏（完全伪同层：所有交互在前端界面内完成）
  $('#form_sheld').hide();
  $('#send_form').hide();

  // 监听聊天文件变更，重新加载脚本
  let current_chat_id = SillyTavern.getCurrentChatId();
  eventOn(tavern_events.CHAT_CHANGED, (chat_id: string) => {
    if (current_chat_id !== chat_id) {
      current_chat_id = chat_id;
      reloadIframe();
    }
  });
});
