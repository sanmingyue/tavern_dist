import { dispatchGameAction } from './actionService';
import { applyLanjingTags } from './tagParser';
import { writeSave } from './saveService';
import { assembleTextResourcesForNarration } from './textResourceAssemblyService';
import type { GameSave } from '../types/schema';

export type GenerateNarrationOptions = {
  shouldStream?: boolean;
  onStream?: (text: string) => void;
  maxChatHistory?: 'all' | number;
};

export async function generateNarration(
  save: GameSave,
  playerText: string,
  options: GenerateNarrationOptions = {},
): Promise<string> {
  let streamHandler: { stop: () => void } | null = null;
  let d0Injection: { uninject: () => void } | null = null;

  try {
    dispatchGameAction(save, { type: 'COMMS_SEND', text: playerText }, { persist: false });
    const assembly = await assembleTextResourcesForNarration(save, playerText);
    d0Injection = injectPrompts(
      [
        {
          id: `lanjing-text-resource-d0-${Date.now()}`,
          content: assembly.d0Text,
          position: 'in_chat',
          depth: 0,
          role: 'system',
          should_scan: false,
        },
      ],
      { once: true },
    );
    streamHandler = options.onStream
      ? eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (text: string) => options.onStream?.(text))
      : null;
    const result = await generate({
      user_input: playerText,
      should_stream: options.shouldStream ?? Boolean(options.onStream),
      max_chat_history: options.maxChatHistory ?? 'all',
      overrides: {
        world_info_before: assembly.worldInfoBeforeText,
        world_info_after: assembly.worldInfoAfterText,
        chat_history: {
          with_depth_entries: false,
        },
      },
    });
    applyLanjingTags(save, result, { checkpoint: false });
    writeSave(save);
    return result;
  } finally {
    streamHandler?.stop();
    d0Injection?.uninject();
  }
}
