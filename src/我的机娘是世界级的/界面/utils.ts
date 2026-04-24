/**
 * 清理消息文本：去除代码块（正则替换产生的界面加载代码）、MVU 标签等痕迹，只保留纯剧情文本
 */
export function cleanMessageText(raw: string): string {
  let text = raw;
  // 去除 ``` 包裹的代码块（正则替换产生的界面加载代码）
  text = text.replace(/```[\s\S]*?```/g, '');
  // 去除 <body>...</body> HTML 标签（正则替换产生的界面加载代码）
  text = text.replace(/<body>[\s\S]*?<\/body>/gi, '');
  // 去除独立的 <script>...</script> 标签
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  // 去除 <pre><code>...</code></pre> 代码块（格式化后的代码块）
  text = text.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
  // 去除 <update>...</update> 及 <updatevariable>...</updatevariable> 变量更新块
  text = text.replace(/<update(?:variable)?>[\s\S]*?<\/update(?:variable)?>/gi, '');
  // 去除未闭合的 <update>/<updatevariable> 标签（流式输出中断）
  text = text.replace(/<update(?:variable)?>[\s\S]*$/gi, '');
  // 去除 <track_data>...</track_data> 赛道数据块
  text = text.replace(/<track_data>[\s\S]*?<\/track_data>/gi, '');
  // 去除 <StatusPlaceHolderImpl/> 占位符
  text = text.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
  // 去除 <details>/<summary> 折叠块（正则美化产物）
  text = text.replace(/<details>[\s\S]*?<\/details>/gi, '');
  // 去除 <基础确认> 等自定义 XML 标签（保留标签内的文本内容）
  text = text.replace(/<\/?[基础确认]+>/gi, '');
  // 清理多余空行
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/**
 * 将纯文本转换为简单 HTML（不经过酒馆正则），用于剧情视图展示
 * 避免使用 formatAsDisplayedMessage，因为它会触发酒馆正则（如 /.+/s 全文替换）
 */
export function textToStoryHtml(text: string): string {
  if (!text) return '';
  // 转义 HTML 特殊字符
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // 处理 markdown 粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 处理 markdown 斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // 按段落分割（双换行）
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // 段内单换行转 <br>
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('');
  return html;
}
