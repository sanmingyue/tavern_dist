<template>
  <div class="qq-app">
    <!-- ═══ 好友个人资料页 ═══ -->
    <template v-if="viewingProfile">
      <div class="profile-page">
        <div class="profile-header-bar">
          <button class="back-btn" @click="viewingProfile = null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="profile-header-title">个人资料</span>
          <div style="width: 32px"></div>
        </div>

        <div class="profile-scroll">
          <!-- 头像 + 基本信息 -->
          <div class="profile-card">
            <div class="profile-avatar-large" :style="getAvatarStyle(viewingProfile)" @click.stop="pickAvatar(viewingProfile)" title="点击更换头像">
              <span v-if="!hasAvatar(viewingProfile)">{{ viewingProfile.charAt(0) }}</span>
            </div>
            <div class="profile-name-row">
              <span class="profile-name">{{ viewingProfile }}</span>
              <span v-if="getContactAlias(viewingProfile)" class="profile-alias"
                >（{{ getContactAlias(viewingProfile) }}）</span
              >
            </div>
            <div class="profile-id">闪讯号: {{ getContactQQNumber(viewingProfile) }}</div>
          </div>

          <!-- 详细信息 -->
          <div class="profile-section">
            <div class="profile-row">
              <span class="profile-label">签名</span>
              <span class="profile-value">{{ getContactSignature(viewingProfile) || '这个人很懒，什么都没留下' }}</span>
            </div>
            <div class="profile-row">
              <span class="profile-label">关系</span>
              <span class="profile-value">
                <span v-for="tag in getContactTags(viewingProfile)" :key="tag" class="profile-tag">{{ tag }}</span>
                <span v-if="getContactTags(viewingProfile).length === 0" style="color: var(--text-muted)">好友</span>
              </span>
            </div>
            <div class="profile-row">
              <span class="profile-label">来源</span>
              <span class="profile-value">{{ getContactSource(viewingProfile) }}</span>
            </div>
            <div class="profile-row">
              <span class="profile-label">添加时间</span>
              <span class="profile-value">{{ formatAddedTime(viewingProfile) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="profile-actions">
            <button class="profile-action-btn primary" @click="openChatFromProfile(viewingProfile)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              发消息
            </button>
            <button class="profile-action-btn secondary" @click="callFromProfile(viewingProfile)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                />
              </svg>
              语音通话
            </button>
          </div>

          <!-- 更多选项 -->
          <div class="profile-section">
            <div class="profile-row clickable" @click="setContactAlias(viewingProfile)">
              <span class="profile-label">设置备注</span>
              <div class="profile-row-right">
                <span class="profile-value-short">{{ getContactAlias(viewingProfile) || '未设置' }}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            <div class="profile-row clickable danger" @click="confirmDeleteFriend(viewingProfile)">
              <span class="profile-label" style="color: var(--danger)">删除好友</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ 聊天详情视图 ═══ -->
    <template v-else-if="activeChatContact">
      <div class="chat-header">
        <button class="back-btn" @click="activeChatContact = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div class="chat-header-info" style="cursor: pointer" @click="viewingProfile = activeChatContact">
          <div class="chat-avatar" :style="getAvatarStyle(activeChatContact)" @click.stop="pickAvatar(activeChatContact)" title="点击更换头像">
            <span v-if="!hasAvatar(activeChatContact)">{{ activeChatContact.charAt(0) }}</span>
          </div>
          <span class="chat-name">{{ activeChatContact }}</span>
        </div>
        <div class="chat-header-actions">
          <button
            class="back-btn"
            :class="{ spinning: isRerolling }"
            :disabled="isRerolling || isTyping || chatMessages.length === 0"
            title="删除上一轮"
            aria-label="删除上一轮"
            @click="showRerollConfirm = true"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
          <button class="back-btn" @click="viewingProfile = activeChatContact">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 拉黑提示条 -->
      <div v-if="isContactBlocked(activeChatContact)" class="blocked-banner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <span>对方已将你拉黑，消息将无法送达</span>
      </div>

      <div ref="chatMessagesRef" class="chat-messages">
        <div v-if="chatMessages.length === 0 && !isTyping" class="chat-empty">
          <p>暂无消息记录</p>
          <span>发送一条消息开始聊天</span>
        </div>
        <template v-for="msg in chatMessages" :key="msg.id">
          <!-- 撤回的消息 -->
          <div v-if="msg.recalled" class="chat-system-msg">
            <span>「{{ msg.from }}」撤回了一条消息</span>
          </div>
          <!-- 已读标记 -->
          <div v-else-if="msg.content === '[已读]'" class="chat-read-receipt">
            <span>已读</span>
          </div>
          <!-- 闪照消息 -->
          <div
            v-else-if="msg.type === 'flash_photo'"
            class="chat-bubble-wrapper"
            :class="{ 'is-self': msg.from === ownerName }"
          >
            <div class="flash-photo-bubble" :class="{ viewed: msg.flashViewed }" @click="viewFlashPhoto(msg)">
              <template v-if="msg.flashViewed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="3" x2="21" y2="21" />
                </svg>
                <span>闪照已销毁</span>
              </template>
              <template v-else>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>闪照 · 点击查看</span>
              </template>
            </div>
            <span class="chat-time">{{ formatMsgTime(msg.timestamp) }}</span>
          </div>
          <!-- 普通消息（含撤回动画） -->
          <div v-else class="chat-bubble-wrapper" :class="{ 'is-self': msg.from === ownerName }">
            <div
              v-if="resolveStickerMessage(msg)"
              class="chat-sticker"
              :class="{ self: msg.from === ownerName }"
              :title="getStickerAlt(resolveStickerMessage(msg))"
            >
              <img
                v-if="!stickerLoadErrors[msg.id]"
                class="chat-sticker-img"
                :src="resolveStickerMessage(msg)?.url || ''"
                :alt="getStickerAlt(resolveStickerMessage(msg))"
                loading="lazy"
                referrerpolicy="no-referrer"
                draggable="false"
                @error="markStickerLoadError(msg.id)"
              />
              <span v-else class="sticker-fallback">{{ getStickerFallbackText(msg) }}</span>
            </div>
            <div v-else class="chat-bubble" :class="{ self: msg.from === ownerName }" :data-msg-id="msg.id">
              <template v-for="(part, partIndex) in getMessageParts(msg)" :key="`${msg.id}-${partIndex}`">
                <span v-if="part.type === 'text'">{{ part.text }}</span>
                <img
                  v-else-if="!stickerLoadErrors[getInlineStickerKey(msg, partIndex)]"
                  class="inline-sticker-img"
                  :src="part.sticker.url"
                  :alt="getStickerAlt(part.sticker)"
                  :title="getStickerAlt(part.sticker)"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  draggable="false"
                  @error="markStickerLoadError(getInlineStickerKey(msg, partIndex))"
                />
                <span v-else class="inline-sticker-fallback">[表情:{{ part.label }}]</span>
              </template>
            </div>
            <span class="chat-time">{{ formatMsgTime(msg.timestamp) }}</span>
          </div>
        </template>
        <!-- 正在输入动画 -->
        <div v-if="isTyping" class="chat-bubble-wrapper">
          <div class="chat-bubble typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-input-bar">
        <input
          v-model="chatInput"
          type="text"
          :placeholder="isContactBlocked(activeChatContact) ? '对方已拉黑你' : '输入消息...'"
          class="chat-input"
          :disabled="isContactBlocked(activeChatContact)"
          @keyup.enter="sendChatMessage"
        />
        <button
          class="send-btn"
          :disabled="!chatInput.trim() || isContactBlocked(activeChatContact)"
          @click="sendChatMessage"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <!-- 闪照查看浮层 -->
      <div v-if="viewingFlash" class="flash-overlay" @click="closeFlashPhoto">
        <div class="flash-content">
          <div class="flash-timer">{{ flashCountdown }}s</div>
          <p class="flash-text">{{ viewingFlash.content }}</p>
          <span class="flash-hint">点击任意处关闭</span>
        </div>
      </div>
    </template>

    <!-- ═══ 主页面（含Tab导航） ═══ -->
    <template v-else>
      <!-- Tab 内容区 -->
      <div class="tab-content">
        <!-- ═══ Tab: 消息 ═══ -->
        <div v-if="activeTab === 'messages'" class="tab-page">
          <div class="tab-header">
            <span class="tab-header-title">闪讯</span>
            <button class="header-action" @click="showNewChatMenu = !showNewChatMenu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input v-model="searchQuery" type="text" placeholder="搜索" class="search-input" />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- 消息列表 -->
          <div v-if="filteredConversations.length > 0" class="messages-list">
            <div
              v-for="conv in filteredConversations"
              :key="conv.contactName"
              class="conversation-item"
              :class="{ unread: conv.unreadCount > 0 }"
              @click="openChat(conv.contactName)"
            >
              <div class="avatar-wrapper">
                <div class="avatar" :style="getAvatarStyle(conv.contactName)" @click.stop="pickAvatar(conv.contactName)" title="点击更换头像">
                  <span v-if="!hasAvatar(conv.contactName)">{{ conv.contactName.charAt(0) }}</span>
                </div>
              </div>
              <div class="conv-content">
                <div class="conv-header">
                  <span class="conv-name">{{ conv.contactName }}</span>
                  <span class="conv-time">{{ formatTime(conv.lastUpdate) }}</span>
                </div>
                <div class="conv-preview">
                  <span class="preview-text">{{ conv.lastMessage }}</span>
                  <span v-if="conv.unreadCount > 0" class="unread-badge">
                    {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="8" cy="10" r="1" fill="currentColor" />
              <circle cx="12" cy="10" r="1" fill="currentColor" />
              <circle cx="16" cy="10" r="1" fill="currentColor" />
            </svg>
            <p>{{ searchQuery ? '未找到相关聊天' : '暂无消息' }}</p>
            <span class="hint">{{ searchQuery ? '尝试其他关键词' : '当角色给你发消息时，这里会出现' }}</span>
          </div>
        </div>

        <!-- ═══ Tab: 联系人 ═══ -->
        <div v-if="activeTab === 'contacts'" class="tab-page">
          <div class="tab-header">
            <span class="tab-header-title">联系人</span>
            <button class="header-action" @click="showAddFriend = true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </button>
          </div>

          <!-- 搜索联系人 -->
          <div class="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input v-model="contactSearch" type="text" placeholder="搜索联系人" class="search-input" />
          </div>

          <!-- 新的朋友入口 -->
          <div class="contact-entry" @click="showFriendRequests = true">
            <div class="entry-icon" style="background: #ff9500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span class="entry-name">新的朋友</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <!-- 群聊入口 -->
          <div class="contact-entry" @click="showGroupChats = true">
            <div class="entry-icon" style="background: #34c759">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <span class="entry-name">群聊</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <!-- 好友列表 -->
          <div class="section-label">好友列表</div>
          <div class="contact-list-scroll">
            <template v-if="filteredContacts.length > 0">
              <template v-for="group in groupedContacts" :key="group.letter">
                <div class="group-letter">{{ group.letter }}</div>
                <div
                  v-for="contact in group.contacts"
                  :key="contact.name"
                  class="contact-item"
                  @click="viewingProfile = contact.name"
                >
                  <div class="contact-avatar" :style="getAvatarStyle(contact.name)" @click.stop="pickAvatar(contact.name)" title="点击更换头像">
                    <span v-if="!hasAvatar(contact.name)">{{ contact.name.charAt(0) }}</span>
                  </div>
                  <div class="contact-info">
                    <span class="contact-name">{{ contact.name }}</span>
                    <span v-if="contact.tags && contact.tags.length" class="contact-tags">{{
                      contact.tags.join(' · ')
                    }}</span>
                  </div>
                </div>
              </template>
            </template>
            <div v-else class="empty-state small">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <p>暂无联系人</p>
              <span class="hint">点击右上角添加好友</span>
            </div>
          </div>
          <div class="contact-count">{{ contactsList.length }} 位联系人</div>
        </div>

        <!-- ═══ Tab: 动态 ═══ -->
        <div v-if="activeTab === 'moments'" class="tab-page">
          <div class="tab-header">
            <span class="tab-header-title">动态</span>
            <button class="header-action" @click="showPublishMoment = true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>

          <div class="moments-scroll">
            <!-- AI 生成动态入口 -->
            <div class="ai-moment-bar" @click="generateMoments">
              <div class="ai-icon">✨</div>
              <div class="ai-text">
                <span class="ai-title">{{ isGenerating ? '生成中...' : 'AI 生成好友动态' }}</span>
                <span class="ai-desc">基于剧情生成好友们的朋友圈</span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-tertiary)"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <!-- 动态列表 -->
            <div v-for="moment in moments" :key="moment.id" class="moment-card">
              <div class="moment-header">
                <div class="moment-avatar" :style="getAvatarStyle(moment.author)" @click.stop="pickAvatar(moment.author)" title="点击更换头像">
                  <span v-if="!hasAvatar(moment.author)">{{ moment.author.charAt(0) }}</span>
                </div>
                <div class="moment-author-info">
                  <span class="moment-author">{{ moment.author }}</span>
                  <span class="moment-time">{{ moment.time }}</span>
                </div>
              </div>
              <p class="moment-text">{{ moment.content }}</p>
              <div v-if="moment.images > 0" class="moment-images">
                <div
                  v-for="i in Math.min(moment.images, 3)"
                  :key="i"
                  class="moment-img-placeholder"
                  :style="{ backgroundColor: getAvatarColor(moment.author + i) }"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    stroke-width="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              </div>
              <div class="moment-actions">
                <button class="moment-action" :class="{ liked: moment.liked }" @click="toggleMomentLike(moment)">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    :fill="moment.liked ? '#fe2c55' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  <span>{{ moment.likes }}</span>
                </button>
                <button class="moment-action" @click="commentOnMoment(moment)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{{ moment.comments.length }}</span>
                </button>
              </div>
              <!-- 评论列表 -->
              <div v-if="moment.comments.length > 0" class="moment-comments">
                <div v-for="c in moment.comments" :key="c.id" class="moment-comment">
                  <span class="comment-author">{{ c.author }}</span>
                  <span class="comment-text">{{ c.content }}</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="moments.length === 0 && !isGenerating" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3C12 3 14 7 14 12C14 17 12 21 12 21" />
                <path d="M12 3C12 3 10 7 10 12C10 17 12 21 12 21" />
                <path d="M3 12H21" />
              </svg>
              <p>暂无动态</p>
              <span class="hint">点击上方 AI 生成好友动态</span>
            </div>
          </div>
        </div>

        <!-- ═══ Tab: 我的 ═══ -->
        <div v-if="activeTab === 'me'" class="tab-page">
          <div class="tab-header">
            <span class="tab-header-title">我的</span>
          </div>

          <div class="me-scroll">
            <!-- 个人名片 -->
            <div class="me-profile-card" @click="showEditProfile = true">
              <div class="me-avatar" :style="getAvatarStyle(ownerName)" @click.stop="pickAvatar(ownerName)" title="点击更换头像">
                <span v-if="!hasAvatar(ownerName)">{{ ownerName.charAt(0) }}</span>
              </div>
              <div class="me-info">
                <span class="me-name">{{ ownerName }}</span>
                <span class="me-id">闪讯号: {{ qqNumber }}</span>
                <span class="me-signature">{{ signature || '点击设置签名' }}</span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-tertiary)"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <!-- 功能列表 -->
            <div class="me-group">
              <div class="me-item" @click="handleMeAction('favorites')">
                <div class="me-item-icon" style="background: #ff9500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
                  </svg>
                </div>
                <span class="me-item-label">我的收藏</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div class="me-item" @click="handleMeAction('album')">
                <div class="me-item-icon" style="background: #007aff">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span class="me-item-label">我的相册</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div class="me-item" @click="handleMeAction('files')">
                <div class="me-item-icon" style="background: #5ac8fa">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span class="me-item-label">我的文件</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div class="me-group">
              <div class="me-item" @click="handleMeAction('wallet')">
                <div class="me-item-icon" style="background: #ff3b30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <span class="me-item-label">QQ钱包</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div class="me-item" @click="handleMeAction('dressup')">
                <div class="me-item-icon" style="background: #af52de">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="13.5" cy="6.5" r="0.5" fill="white" />
                    <circle cx="17.5" cy="10.5" r="0.5" fill="white" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688z" />
                  </svg>
                </div>
                <span class="me-item-label">个性装扮</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div class="me-group">
              <div class="me-item" @click="editSignature">
                <div class="me-item-icon" style="background: #8e8e93">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                    />
                  </svg>
                </div>
                <span class="me-item-label">设置</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ 底部 Tab 导航 ═══ -->
      <TabBar :tabs="tabs" :active-tab="activeTab" @tab-change="activeTab = $event" />
    </template>

    <!-- ═══ 添加好友弹窗（完整表单） ═══ -->
    <div v-if="showAddFriend" class="modal-overlay" @click.self="showAddFriend = false">
      <div class="modal-dialog" style="width: 290px">
        <div class="modal-title">添加好友</div>
        <div style="margin-bottom: 8px">
          <div class="modal-label">真实姓名 *</div>
          <input v-model="newFriendName" class="modal-input" placeholder="角色完整姓名" />
        </div>
        <div style="margin-bottom: 8px">
          <div class="modal-label">闪讯昵称</div>
          <input v-model="newFriendNickname" class="modal-input" placeholder="对方的网名（选填）" />
        </div>
        <div style="margin-bottom: 8px">
          <div class="modal-label">闪讯号</div>
          <input v-model="newFriendId" class="modal-input" placeholder="6-10位数字（选填，自动生成）" />
        </div>
        <div style="margin-bottom: 8px">
          <div class="modal-label">关系标签</div>
          <input v-model="newFriendRelation" class="modal-input" placeholder="如：同学、同事（选填）" />
        </div>
        <div v-if="addFriendError" class="modal-error">{{ addFriendError }}</div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showAddFriend = false">取消</button>
          <button class="modal-btn confirm" :disabled="!newFriendName.trim()" @click="addFriend">添加</button>
        </div>
      </div>
    </div>

    <!-- ═══ 新的朋友弹窗 ═══ -->
    <div v-if="showFriendRequests" class="modal-overlay" @click.self="showFriendRequests = false">
      <div class="modal-sheet">
        <div class="sheet-header">
          <button class="sheet-cancel" @click="showFriendRequests = false">关闭</button>
          <span class="sheet-title">新的朋友</span>
          <button
            class="sheet-submit"
            @click="
              showAddFriend = true;
              showFriendRequests = false;
            "
          >
            添加
          </button>
        </div>
        <div class="friend-request-list">
          <div v-if="friendRequests.length === 0" class="empty-state small" style="padding: 30px">
            <p>暂无好友请求</p>
            <span class="hint">点击右上角「添加」手动添加好友</span>
          </div>
          <div v-for="req in friendRequests" :key="req.name" class="friend-request-item">
            <div class="contact-avatar" :style="getAvatarStyle(req.name)" @click.stop="pickAvatar(req.name)" title="点击更换头像">
              <span v-if="!hasAvatar(req.name)">{{ req.name.charAt(0) }}</span>
            </div>
            <div class="req-info">
              <span class="req-name">{{ req.name }}</span>
              <span class="req-msg">{{ req.message }}</span>
            </div>
            <button v-if="req.status === 'pending'" class="accept-btn" @click="acceptFriendRequest(req)">接受</button>
            <span v-else class="accepted-text">已添加</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 群聊管理弹窗 ═══ -->
    <div v-if="showGroupChats" class="modal-overlay" @click.self="showGroupChats = false">
      <div class="modal-sheet">
        <div class="sheet-header">
          <button class="sheet-cancel" @click="showGroupChats = false">关闭</button>
          <span class="sheet-title">群聊</span>
          <button class="sheet-submit" @click="showCreateGroup = true">创建</button>
        </div>
        <div class="group-list">
          <div v-if="groupChats.length === 0" class="empty-state small" style="padding: 30px">
            <p>暂无群聊</p>
            <span class="hint">点击右上角「创建」发起群聊</span>
          </div>
          <div
            v-for="group in groupChats"
            :key="group.name"
            class="group-item"
            @click="
              openChat(group.name);
              showGroupChats = false;
            "
          >
            <div class="group-avatar" :style="getAvatarStyle(group.name)" @click.stop="pickAvatar(group.name)" title="点击更换头像">
              <svg v-if="!hasAvatar(group.name)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div class="group-info">
              <span class="group-name">{{ group.name }}</span>
              <span class="group-members">{{ group.members.length }}人</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 创建群聊弹窗 ═══ -->
    <div v-if="showCreateGroup" class="modal-overlay" @click.self="showCreateGroup = false">
      <div class="modal-dialog" style="width: 300px">
        <div class="modal-title">创建群聊</div>
        <input v-model="newGroupName" class="modal-input" placeholder="群聊名称" style="margin-bottom: 10px" />
        <div class="section-label" style="padding: 4px 0">选择成员</div>
        <div class="member-select-list">
          <label v-for="contact in contactsList" :key="contact.name" class="member-select-item">
            <input v-model="selectedGroupMembers" type="checkbox" :value="contact.name" />
            <div
              class="contact-avatar"
              style="width: 28px; height: 28px; font-size: 12px"
              :style="getAvatarStyle(contact.name)"
              @click.stop="pickAvatar(contact.name)"
              title="点击更换头像"
            >
              <span v-if="!hasAvatar(contact.name)">{{ contact.name.charAt(0) }}</span>
            </div>
            <span>{{ contact.name }}</span>
          </label>
        </div>
        <div v-if="createGroupError" class="modal-error">{{ createGroupError }}</div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showCreateGroup = false">取消</button>
          <button
            class="modal-btn confirm"
            :disabled="!newGroupName.trim() || selectedGroupMembers.length === 0"
            @click="createGroup"
          >
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ 发布动态弹窗 ═══ -->
    <div v-if="showPublishMoment" class="modal-overlay" @click.self="showPublishMoment = false">
      <div class="modal-sheet">
        <div class="sheet-header">
          <button class="sheet-cancel" @click="showPublishMoment = false">取消</button>
          <span class="sheet-title">发表动态</span>
          <button class="sheet-submit" :disabled="!newMomentText.trim()" @click="publishMoment">发表</button>
        </div>
        <textarea v-model="newMomentText" class="moment-textarea" placeholder="分享你的想法..." rows="5"></textarea>
      </div>
    </div>

    <!-- ═══ 编辑个人信息弹窗 ═══ -->
    <div v-if="showEditProfile" class="modal-overlay" @click.self="showEditProfile = false">
      <div class="modal-dialog">
        <div class="modal-title">编辑个人信息</div>
        <div style="margin-bottom: 10px">
          <div class="modal-label">用户名</div>
          <input v-model="editName" class="modal-input" placeholder="输入用户名" />
        </div>
        <div style="margin-bottom: 10px">
          <div class="modal-label">签名</div>
          <input v-model="editSignatureText" class="modal-input" placeholder="输入个性签名" />
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showEditProfile = false">取消</button>
          <button class="modal-btn confirm" @click="saveProfile">保存</button>
        </div>
      </div>
    </div>

    <!-- ═══ 设置备注弹窗 ═══ -->
    <div v-if="showSetAlias" class="modal-overlay" @click.self="showSetAlias = false">
      <div class="modal-dialog">
        <div class="modal-title">设置备注</div>
        <input v-model="editAliasText" class="modal-input" placeholder="输入备注名" @keyup.enter="saveAlias" />
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showSetAlias = false">取消</button>
          <button class="modal-btn confirm" @click="saveAlias">保存</button>
        </div>
      </div>
    </div>

    <!-- ═══ 删除好友确认弹窗 ═══ -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-dialog">
        <div class="modal-title">删除好友</div>
        <p style="font-size: 14px; color: var(--text-secondary); text-align: center; margin: 0 0 14px">
          确定要删除好友「{{ deletingFriend }}」吗？<br />删除后将清除聊天记录。
        </p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="modal-btn confirm" style="background: var(--danger)" @click="doDeleteFriend">删除</button>
        </div>
      </div>
    </div>

    <!-- ═══ 删除上一轮确认弹窗 ═══ -->
    <div v-if="showRerollConfirm" class="modal-overlay" @click.self="showRerollConfirm = false">
      <div class="modal-dialog">
        <div class="modal-title">确认删除</div>
        <p style="font-size: 14px; color: var(--text-secondary); text-align: center; margin: 0 0 14px">
          将删除最近一轮闪讯消息。确定继续吗？
        </p>
        <div class="modal-actions">
          <button class="modal-btn cancel" :disabled="isRerolling" @click="showRerollConfirm = false">取消</button>
          <button class="modal-btn confirm" style="background: var(--danger)" :disabled="isRerolling" @click="confirmRerollChatTurn">
            删除
          </button>
        </div>
      </div>
    </div>
    <input ref="avatarInputRef" class="avatar-file-input" type="file" accept="image/*" @change="onAvatarSelected" />
  </div>
</template>

<script setup lang="ts">
import TabBar from '../../components/TabBar.vue';
import { usePhoneStore } from '../../stores/phone-store';
import { cleanMessagesReplyText } from '../../utils/app-names';
import { generateForApp } from '../../utils/generation-pipeline';
import { getLocalDB, type ChatRecordMessage } from '../../utils/local-db';
import { saveChatMessage } from '../../utils/memory-system';
import {
  extractStickerName,
  getStickerForContent,
  getStickerMessageParts,
  type ResolvedSticker,
  type StickerMessagePart,
} from '../../stickers';

const store = usePhoneStore();

// ─── Tab 导航 ───
const activeTab = ref('messages');
const avatarInputRef = ref<HTMLInputElement | null>(null);
const pendingAvatarName = ref('');
const tabs = computed(() => [
  { id: 'messages' as const, label: '消息', badge: totalUnread.value },
  { id: 'contacts' as const, label: '联系人' },
  { id: 'moments' as const, label: '动态' },
  { id: 'me' as const, label: '我的' },
]);

// ─── 公共状态 ───
const searchQuery = ref('');
const contactSearch = ref('');
const activeChatContact = ref<string | null>(null);
const viewingProfile = ref<string | null>(null);
const chatInput = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);
const isGenerating = ref(false);
const isTyping = ref(false);
const isRerolling = ref(false);
const showRerollConfirm = ref(false);

// ─── 闪照相关 ───
const viewingFlash = ref<ChatRecordMessage | null>(null);
const flashCountdown = ref(5);
let flashTimer: ReturnType<typeof setInterval> | null = null;

function viewFlashPhoto(msg: ChatRecordMessage) {
  if (msg.flashViewed) return;
  viewingFlash.value = msg;
  flashCountdown.value = 5;
  flashTimer = setInterval(() => {
    flashCountdown.value--;
    if (flashCountdown.value <= 0) {
      closeFlashPhoto();
    }
  }, 1000);
}

async function closeFlashPhoto() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  if (viewingFlash.value) {
    viewingFlash.value.flashViewed = true;
    // 持久化到 IndexedDB
    try {
      if (activeChatContact.value) {
        const db = await getLocalDB();
        const record = await db.getChatRecord(activeChatContact.value);
        if (record) {
          const m = record.messages.find(x => x.id === viewingFlash.value?.id);
          if (m) {
            m.flashViewed = true;
            await db.saveChatRecord(record);
          }
        }
      }
    } catch {
      /* silent */
    }
    viewingFlash.value = null;
  }
}

// ─── 拉黑检测 ───
function isContactBlocked(name: string | null): boolean {
  if (!name) return false;
  return !!(store.phoneData.contacts[name] as any)?.blocked;
}

function resolveStickerMessage(msg: ChatRecordMessage): ResolvedSticker | null {
  return getStickerForContent(msg.content, msg.id);
}

function getMessageParts(msg: ChatRecordMessage): StickerMessagePart[] {
  return getStickerMessageParts(msg.content, msg.id);
}

function getStickerAlt(sticker: ResolvedSticker | null): string {
  if (!sticker) return '表情';
  return `${sticker.groupLabel}表情：${sticker.label}`;
}

function getInlineStickerKey(msg: ChatRecordMessage, partIndex: number): string {
  return `${msg.id}:inline:${partIndex}`;
}

function markStickerLoadError(key: string): void {
  stickerLoadErrors.value = { ...stickerLoadErrors.value, [key]: true };
}

function getStickerFallbackText(msg: ChatRecordMessage): string {
  const label = extractStickerName(msg.content);
  return label ? `[表情:${label}]` : msg.content;
}

function getMessagePreview(content: string): string {
  const stickerName = extractStickerName(content);
  if (stickerName) return `[表情] ${stickerName}`;
  return content.replace(/\[表情[:：]([^\]]+)\]/g, '[表情] $1');
}

// ─── 消息页数据 ───
interface ConversationSummary {
  contactName: string;
  lastMessage: string;
  lastUpdate: number;
  unreadCount: number;
}

const conversations = ref<ConversationSummary[]>([]);
const chatMessages = ref<ChatRecordMessage[]>([]);
const showNewChatMenu = ref(false);
const stickerLoadErrors = ref<Record<string, boolean>>({});

const ownerName = computed(() => store.phoneData.device.owner || SillyTavern.name1 || '用户');

const totalUnread = computed(() => {
  return (
    conversations.value.reduce((sum, c) => sum + c.unreadCount, 0) +
    Object.values(store.phoneData.conversations).reduce((sum, c) => sum + c.unread, 0)
  );
});

async function loadConversations() {
  try {
    const db = await getLocalDB();
    const records = await db.getAllChatRecords();
    conversations.value = records
      .map(r => ({
        contactName: r.contactName,
        lastMessage: r.messages.length > 0 ? getMessagePreview(r.messages[r.messages.length - 1].content) : '',
        lastUpdate: r.lastUpdate,
        unreadCount: r.messages.filter(m => !m.read && m.from !== ownerName.value).length,
      }))
      .sort((a, b) => b.lastUpdate - a.lastUpdate);
  } catch {
    conversations.value = [];
  }
}

const mergedConversations = computed(() => {
  const dbConvs = [...conversations.value];
  for (const [name, conv] of Object.entries(store.phoneData.conversations)) {
    if (!dbConvs.find(c => c.contactName === name) && conv.messages.length > 0) {
      dbConvs.push({
        contactName: name,
        lastMessage: getMessagePreview(conv.messages[conv.messages.length - 1]?.content || ''),
        lastUpdate: conv.lastUpdate,
        unreadCount: conv.unread,
      });
    }
  }
  return dbConvs.sort((a, b) => b.lastUpdate - a.lastUpdate);
});

const filteredConversations = computed(() => {
  if (!searchQuery.value) return mergedConversations.value;
  const q = searchQuery.value.toLowerCase();
  return mergedConversations.value.filter(
    c => c.contactName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
  );
});

async function loadChatMessages(contactName: string) {
  try {
    const db = await getLocalDB();
    const record = await db.getChatRecord(contactName);
    chatMessages.value = record?.messages || [];
    if (record && record.messages.some(m => !m.read)) {
      record.messages.forEach(m => {
        m.read = true;
      });
      await db.saveChatRecord(record);
    }
  } catch {
    chatMessages.value = [];
  }
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
}

function openChat(contactName: string) {
  activeChatContact.value = contactName;
  viewingProfile.value = null;
  store.selectContact(contactName);
  loadChatMessages(contactName);
}

function openChatFromProfile(contactName: string) {
  viewingProfile.value = null;
  openChat(contactName);
}

function callFromProfile(contactName: string) {
  store.reportAction({
    appId: 'messages',
    action: '语音通话',
    summary: `用户在闪讯给「${contactName}」发起了语音通话`,
  });
  toastr.info(`正在呼叫「${contactName}」...`, '闪讯');
}

function isSelfChatMessage(message: ChatRecordMessage, contactName: string): boolean {
  return message.from === ownerName.value || message.to === contactName;
}

function collectLocalRerollIndexes(messages: ChatRecordMessage[], contactName: string): number[] {
  let userIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isSelfChatMessage(messages[i], contactName)) {
      userIndex = i;
      break;
    }
  }

  if (userIndex < 0) return [];

  const indexes: number[] = [userIndex];
  for (let i = userIndex + 1; i < messages.length; i++) {
    if (isSelfChatMessage(messages[i], contactName)) break;
    indexes.push(i);
  }

  return indexes.sort((a, b) => b - a);
}

function syncPhoneStoreAfterReroll(contactName: string, removedMessages: ChatRecordMessage[]): void {
  const conversation = store.phoneData.conversations[contactName];
  if (!conversation) return;

  for (const message of removedMessages) {
    if (!isSelfChatMessage(message, contactName)) continue;
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
      const stored = conversation.messages[i];
      if (stored.from === message.from && stored.to === message.to && stored.content === message.content) {
        conversation.messages.splice(i, 1);
        break;
      }
    }
  }

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  conversation.lastUpdate = lastMessage?.timestamp ?? Date.now();
  conversation.unread = conversation.messages.filter(m => !m.read && m.from !== ownerName.value).length;
}

async function rollbackLocalChatTurn(contactName: string): Promise<number> {
  const db = await getLocalDB();
  const record = await db.getChatRecord(contactName);
  if (!record || record.messages.length === 0) return 0;

  const indexes = collectLocalRerollIndexes(record.messages, contactName);
  if (indexes.length === 0) return 0;

  const removedMessages = indexes.map(index => record.messages[index]).filter(Boolean);
  const indexSet = new Set(indexes);
  record.messages = record.messages.filter((_, index) => !indexSet.has(index));
  const lastMessage = record.messages[record.messages.length - 1];
  record.lastUpdate = lastMessage?.timestamp ?? Date.now();
  await db.saveChatRecord(record);

  await Promise.all(removedMessages.map(async message => {
    try {
      await db.deleteChatMessageArtifacts(contactName, message);
    } catch (e) {
      console.warn('[小手机] 清理闪讯本地记忆索引失败:', e);
    }
  }));
  store.removePendingChatMessages(contactName, removedMessages);
  syncPhoneStoreAfterReroll(contactName, removedMessages);

  return removedMessages.length;
}

async function rerollChatTurn() {
  if (isRerolling.value || isTyping.value || !activeChatContact.value) return;

  const contactName = activeChatContact.value;
  isRerolling.value = true;

  try {
    const localRemovedCount = await rollbackLocalChatTurn(contactName);

    await loadChatMessages(contactName);
    await loadConversations();

    if (localRemovedCount === 0) {
      toastr.warning('没有找到可删除的发言节点', '闪讯');
      return;
    }

    toastr.success(`已删除 ${localRemovedCount} 条消息`, '删除成功');
    console.info('[小手机] 闪讯删除上一轮完成:', { contactName, localRemovedCount });
  } catch (e) {
    console.warn('[小手机] 闪讯删除上一轮失败:', e);
    toastr.error(e instanceof Error ? e.message : '删除失败', '闪讯');
  } finally {
    isRerolling.value = false;
  }
}

async function confirmRerollChatTurn() {
  showRerollConfirm.value = false;
  await rerollChatTurn();
}

async function sendChatMessage() {
  const content = chatInput.value.trim();
  if (!content || !activeChatContact.value) return;

  const contactName = activeChatContact.value;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const msg: ChatRecordMessage = {
    id: msgId,
    from: ownerName.value,
    to: contactName,
    content,
    timestamp: Date.now(),
    type: extractStickerName(content) ? 'sticker' : 'text',
    read: true,
  };

  await saveChatMessage(contactName, msg);
  store.sendMessage(contactName, content, ownerName.value, true);
  chatInput.value = '';
  await loadChatMessages(contactName);

  // 触发 AI 回复（异步，不阻塞 UI）
  if (!isContactBlocked(contactName)) {
    generateReply(contactName, content);
  }
}

/**
 * 调用 AI 以角色身份生成回复消息
 */
async function generateReply(contactName: string, userMessage: string) {
  isTyping.value = true;

  try {
    // 获取最近聊天记录作为上下文
    const recentMsgs = chatMessages.value
      .filter(m => !m.recalled && m.content !== '[已读]')
      .slice(-12)
      .map(m => `${m.from}: ${m.content}`)
      .join('\n');

    const extraContext = `用户「${ownerName.value}」在闪讯给「${contactName}」发了消息：${userMessage}\n\n最近聊天记录：\n${recentMsgs}\n\n请以「${contactName}」的身份回复用户的消息。\n\n输出必须严格使用：\n<闪讯 from="${contactName}">\n消息内容1\n消息内容2\n</闪讯>\n脚本只读取 <闪讯> 标签内的内容，标签外任何内容都会被删除。`;

    const result = await generateForApp('messages', userMessage, extraContext);

    if (!result.success || !result.parsed) {
      console.warn(`[小手机] 闪讯回复生成失败:`, result.error);
      // 生成失败时不显示错误，静默处理
      return;
    }

    const rawReply = cleanMessagesReplyText(String(result.parsed));
    if (!rawReply) return;

    // 解析 AI 回复的多条消息（每行一条）
    const lines = rawReply.split('\n').filter((l: string) => {
      const trimmed = l.trim();
      return trimmed && trimmed !== '[未读]';
    });

    for (const [i, line] of lines.entries()) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 模拟延迟：每条消息间隔 300-800ms
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      }

      // 检测特殊标记
      const parsedMsg = parseMessageLine(trimmed, contactName);

      // 保存到 IndexedDB
      await saveChatMessage(contactName, parsedMsg);

      // 记录完整聊天消息到缓冲（供关闭手机时拼接到正文）
      store.logChatMessage(contactName, contactName, trimmed, parsedMsg.id, ownerName.value);

      // 如果是撤回消息，设置 2 秒后撤回
      if (parsedMsg._pendingRecall) {
        const recallId = parsedMsg.id;
        setTimeout(async () => {
          try {
            const db = await getLocalDB();
            const record = await db.getChatRecord(contactName);
            if (record) {
              const m = record.messages.find(x => x.id === recallId);
              if (m) {
                m.recalled = true;
                m.recallTimestamp = Date.now();
                await db.saveChatRecord(record);
                // 刷新 UI
                if (activeChatContact.value === contactName) {
                  await loadChatMessages(contactName);
                }
              }
            }
          } catch {
            /* silent */
          }
        }, 4000);
      }

      // 实时刷新聊天列表
      if (activeChatContact.value === contactName) {
        await loadChatMessages(contactName);
      }
    }

    console.info(`[小手机] 「${contactName}」回复了 ${lines.length} 条消息`);
  } catch (e) {
    console.warn(`[小手机] 闪讯回复异常:`, e);
  } finally {
    isTyping.value = false;
    // 滚动到底部
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
      }
    });
  }
}

/**
 * 解析单条消息行，检测撤回/闪照/已读等特殊标记
 */
function parseMessageLine(line: string, from: string): ChatRecordMessage & { _pendingRecall?: boolean } {
  const base = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    from,
    to: ownerName.value,
    timestamp: Date.now(),
    read: false,
  };

  // 检测撤回标记：~内容~
  const recallMatch = line.match(/^~(.+)~$/);
  if (recallMatch) {
    return {
      ...base,
      content: recallMatch[1],
      type: 'text' as const,
      _pendingRecall: true,
    };
  }

  // 检测闪照标记：[闪照:描述]
  const flashMatch = line.match(/^\[闪照[:：](.+)\]$/);
  if (flashMatch) {
    return {
      ...base,
      content: flashMatch[1],
      type: 'flash_photo' as const,
      flashViewed: false,
    };
  }

  // 检测表情包标记：[表情:描述]
  if (extractStickerName(line)) {
    return {
      ...base,
      content: line.trim(),
      type: 'sticker' as const,
    };
  }

  // 检测已读标记
  if (line.trim() === '[已读]' || line.trim() === '[未读]') {
    return {
      ...base,
      content: line.trim(),
      type: 'text' as const,
    };
  }

  // 普通文本消息
  return {
    ...base,
    content: line,
    type: 'text' as const,
  };
}

// ─── 联系人页数据 ───
const showAddFriend = ref(false);
const showFriendRequests = ref(false);
const showGroupChats = ref(false);
const showCreateGroup = ref(false);
const showSetAlias = ref(false);
const showDeleteConfirm = ref(false);
const newFriendName = ref('');
const newFriendNickname = ref('');
const newFriendId = ref('');
const newFriendRelation = ref('');
const addFriendError = ref('');
const newGroupName = ref('');
const selectedGroupMembers = ref<string[]>([]);
const createGroupError = ref('');
const editAliasText = ref('');
const aliasTarget = ref('');
const deletingFriend = ref('');

// ─── 好友请求 ───
interface FriendRequest {
  name: string;
  message: string;
  status: 'pending' | 'accepted';
}
const friendRequests = ref<FriendRequest[]>([]);

async function acceptFriendRequest(req: FriendRequest) {
  req.status = 'accepted';
  store.addContact(req.name);
  store.reportAction({
    appId: 'messages',
    action: '接受好友请求',
    summary: `用户在闪讯接受了「${req.name}」的好友请求`,
  });
  toastr.success(`已添加好友「${req.name}」`, '闪讯');
}

// ─── 群聊 ───
interface GroupChat {
  name: string;
  members: string[];
  createdAt: number;
}
const groupChats = ref<GroupChat[]>([]);

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) {
    createGroupError.value = '请输入群名';
    return;
  }
  if (selectedGroupMembers.value.length === 0) {
    createGroupError.value = '请选择至少一个成员';
    return;
  }
  if (groupChats.value.find(g => g.name === name)) {
    createGroupError.value = '群名已存在';
    return;
  }

  const members = [ownerName.value, ...selectedGroupMembers.value];
  groupChats.value.push({ name, members, createdAt: Date.now() });

  // 为群聊创建一个会话
  store.addContact(name);

  store.reportAction({
    appId: 'messages',
    action: '创建群聊',
    summary: `用户在闪讯创建了群聊「${name}」，成员：${members.join('、')}`,
  });
  toastr.success(`已创建群聊「${name}」`, '闪讯');

  newGroupName.value = '';
  selectedGroupMembers.value = [];
  createGroupError.value = '';
  showCreateGroup.value = false;
}

interface ContactInfo {
  name: string;
  tags: string[];
  addedAt: number;
}

const contactsList = computed<ContactInfo[]>(() => {
  return Object.values(store.phoneData.contacts).map(c => ({
    name: c.name,
    tags: c.tags || [],
    addedAt: c.addedAt,
  }));
});

const filteredContacts = computed(() => {
  if (!contactSearch.value) return contactsList.value;
  const q = contactSearch.value.toLowerCase();
  return contactsList.value.filter(c => c.name.toLowerCase().includes(q));
});

interface ContactGroup {
  letter: string;
  contacts: ContactInfo[];
}

const groupedContacts = computed<ContactGroup[]>(() => {
  const groups: Record<string, ContactInfo[]> = {};
  for (const contact of filteredContacts.value) {
    const firstChar = contact.name.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map(([letter, contacts]) => ({ letter, contacts }));
});

async function addFriend() {
  const name = newFriendName.value.trim();
  if (!name) {
    addFriendError.value = '请输入名称';
    return;
  }
  if (store.phoneData.contacts[name]) {
    addFriendError.value = '已是好友';
    return;
  }

  const nickname = newFriendNickname.value.trim() || name;
  const relation = newFriendRelation.value.trim();
  const friendId =
    newFriendId.value.trim() ||
    String(((name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 7919) % 9000000) + 1000000);

  store.addContact(name);
  // 更新额外信息
  if (store.phoneData.contacts[name]) {
    const c = store.phoneData.contacts[name] as any;
    if (relation) c.tags = [relation];
    c.alias = nickname !== name ? nickname : undefined;
    c.phone = friendId;
  }

  store.reportAction({
    appId: 'messages',
    action: '添加好友',
    summary: `用户在闪讯添加了好友「${name}」${relation ? `(${relation})` : ''}`,
  });
  toastr.success(`已添加好友「${name}」`, '闪讯');

  newFriendName.value = '';
  newFriendNickname.value = '';
  newFriendId.value = '';
  newFriendRelation.value = '';
  addFriendError.value = '';
  showAddFriend.value = false;
}

// ─── 动态页数据 ───
const showPublishMoment = ref(false);
const newMomentText = ref('');

interface MomentComment {
  id: string;
  author: string;
  content: string;
}

interface Moment {
  id: string;
  author: string;
  content: string;
  time: string;
  likes: number;
  liked: boolean;
  images: number;
  comments: MomentComment[];
}

const moments = ref<Moment[]>([]);

function toggleMomentLike(moment: Moment) {
  moment.liked = !moment.liked;
  moment.likes += moment.liked ? 1 : -1;
  if (moment.liked) {
    store.reportAction({
      appId: 'messages',
      action: '点赞动态',
      summary: `用户在闪讯给「${moment.author}」的动态点了赞`,
    });
  }
}

function commentOnMoment(moment: Moment) {
  const text = window.parent.prompt?.('写评论:');
  if (text?.trim()) {
    moment.comments.push({
      id: `mc_${Date.now()}`,
      author: ownerName.value,
      content: text.trim(),
    });
    store.reportAction({
      appId: 'messages',
      action: '评论动态',
      summary: `用户在闪讯评论了「${moment.author}」的动态：${text.trim().slice(0, 30)}`,
    });
  }
}

function publishMoment() {
  const text = newMomentText.value.trim();
  if (!text) return;
  moments.value.unshift({
    id: `m_${Date.now()}`,
    author: ownerName.value,
    content: text,
    time: '刚刚',
    likes: 0,
    liked: false,
    images: 0,
    comments: [],
  });
  store.reportAction({
    appId: 'messages',
    action: '发布动态',
    summary: `用户在闪讯发布了动态：${text.slice(0, 40)}`,
  });
  toastr.success('动态已发布', '闪讯');
  newMomentText.value = '';
  showPublishMoment.value = false;
}

async function generateMoments() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const contactNames = Object.keys(store.phoneData.contacts).slice(0, 5).join('、') || '角色';
    const result = await generateForApp(
      'forum',
      `生成 3-4 条好友动态（类似QQ空间/朋友圈），发布者从这些角色中选择：${contactNames}。每条动态要有不同的风格和内容。`,
      `动态发布者角色列表：${contactNames}\n生成的内容要像真实的社交动态，贴近角色的性格。`,
    );

    if (!result.success || !result.parsed) {
      toastr.error(result.error ?? '生成失败', '闪讯');
      return;
    }

    const text = result.parsed;
    // 尝试从 XML 中解析 <post> 块
    const { parseXmlResult, extractXmlBlocks, parseXmlBlock } = await import('../../utils/generation-pipeline');
    let parsedPosts = parseXmlResult(text, 'post', { comments: 'comment' });
    // 如果没有 <post>，则尝试解析其他可能的标签
    if (parsedPosts.length === 0) {
      const momentBlocks = extractXmlBlocks(text, 'moment');
      if (momentBlocks.length > 0) {
        parsedPosts = momentBlocks.map(b => {
          const obj = parseXmlBlock(b);
          // 解析评论子项
          const commentItems = extractXmlBlocks(b, 'comment').map(parseXmlBlock);
          if (commentItems.length > 0) obj.comments = commentItems as any;
          return obj;
        });
      }
    }

    const contactNameList = contactNames.split('、');
    for (const [i, post] of parsedPosts.entries()) {
      if (!post?.content && !post?.body && !post?.title) continue;
      const comments: MomentComment[] = (Array.isArray(post.comments) ? post.comments : [])
        .map((c: any, j: number) => ({
          id: `gc_${Date.now()}_${i}_${j}`,
          author: String(c.author ?? `路人${j + 1}`),
          content: String(c.content ?? ''),
        }))
        .filter((c: MomentComment) => c.content);

      moments.value.unshift({
        id: `ai_${Date.now()}_${i}`,
        author: String(post.author ?? contactNameList[i % contactNameList.length] ?? '匿名'),
        content: String(post.content ?? post.body ?? post.title ?? ''),
        time: '刚刚',
        likes: _.random(1, 50),
        liked: false,
        images: _.random(0, 3),
        comments,
      });
    }
    toastr.success('已生成好友动态', '闪讯');
  } finally {
    isGenerating.value = false;
  }
}

// ─── 我的页数据 ───
const qqNumber = computed(() => {
  const hash = ownerName.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return String(1000000 + ((hash * 7919) % 9000000));
});
const signature = ref('');
const showEditProfile = ref(false);
const editName = ref('');
const editSignatureText = ref('');

// 打开编辑面板时初始化值
watch(showEditProfile, show => {
  if (show) {
    editName.value = ownerName.value;
    editSignatureText.value = signature.value;
    console.info('[小手机] 打开编辑个人信息弹窗');
  }
});

function saveProfile() {
  const newName = editName.value.trim();
  const newSig = editSignatureText.value.trim();

  if (newName && newName !== ownerName.value) {
    // 更新 phone store 中的 owner
    store.phoneData.device.owner = newName;
    // 同步到酒馆用户设定（通过 jQuery 操作酒馆页面）
    try {
      const $personaName = $('#persona_name_input');
      if ($personaName.length) {
        $personaName.val(newName).trigger('input');
        console.info(`[小手机] 已同步用户名「${newName}」到酒馆 persona`);
      }
    } catch (e) {
      console.warn('[小手机] 同步用户名到酒馆失败:', e);
    }
    store.reportAction({
      appId: 'messages',
      action: '修改用户名',
      summary: `用户修改了闪讯用户名为「${newName}」`,
    });
  }

  if (newSig !== signature.value) {
    signature.value = newSig;
    store.reportAction({
      appId: 'messages',
      action: '修改签名',
      summary: `用户修改了闪讯签名：${newSig || '(清空)'}`,
    });
  }

  showEditProfile.value = false;
  toastr.success('个人信息已更新', '闪讯');
  console.info('[小手机] 个人信息已保存:', { name: newName, signature: newSig });
}

function editSignature() {
  showEditProfile.value = true;
}

function handleMeAction(action: string) {
  const actionMap: Record<string, string> = {
    favorites: '查看了我的收藏',
    album: '查看了我的相册',
    files: '查看了我的文件',
    wallet: '打开了QQ钱包',
    dressup: '查看了个性装扮',
  };
  store.reportAction({
    appId: 'messages',
    action: actionMap[action] || action,
    summary: `用户在闪讯${actionMap[action] || action}`,
  });
  toastr.info('功能开发中', '闪讯');
}

// ─── 好友个人资料相关 ───
function getContactQQNumber(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return String(1000000 + ((hash * 7919) % 9000000));
}

function getContactAlias(name: string): string {
  const contact = store.phoneData.contacts[name];
  return (contact as any)?.alias || '';
}

function getContactSignature(_name: string): string {
  // 好友签名暂无存储，返回空
  return '';
}

function getContactTags(name: string): string[] {
  const contact = store.phoneData.contacts[name];
  return (contact as any)?.tags || [];
}

function getContactSource(name: string): string {
  const contact = store.phoneData.contacts[name];
  if (!contact) return '未知';
  const tags = (contact as any)?.tags || [];
  if (tags.length > 0) return '剧情中交换联系方式';
  return '手动添加';
}

function formatAddedTime(name: string): string {
  const contact = store.phoneData.contacts[name];
  if (!contact) return '未知';
  return new Date(contact.addedAt).toLocaleString();
}

function setContactAlias(name: string) {
  aliasTarget.value = name;
  editAliasText.value = getContactAlias(name);
  showSetAlias.value = true;
}

function saveAlias() {
  const name = aliasTarget.value;
  const alias = editAliasText.value.trim();
  if (name && store.phoneData.contacts[name]) {
    (store.phoneData.contacts[name] as any).alias = alias || undefined;
    store.reportAction({
      appId: 'messages',
      action: '设置备注',
      summary: `用户在闪讯为「${name}」设置了备注「${alias || '(清除)'}」`,
    });
    toastr.success(alias ? `已设置备注「${alias}」` : '已清除备注', '闪讯');
  }
  showSetAlias.value = false;
}

function confirmDeleteFriend(name: string) {
  deletingFriend.value = name;
  showDeleteConfirm.value = true;
}

async function doDeleteFriend() {
  const name = deletingFriend.value;
  if (!name) return;

  store.removeContact(name);
  store.reportAction({
    appId: 'messages',
    action: '删除好友',
    summary: `用户在闪讯删除了好友「${name}」`,
  });

  toastr.success(`已删除好友「${name}」`, '闪讯');
  showDeleteConfirm.value = false;
  viewingProfile.value = null;
}

// ─── 工具函数 ───
function getAvatarColor(name: string): string {
  const colors = ['#579bf0', '#50c9c3', '#f5a623', '#7ed321', '#e74c3c', '#9b59b6', '#1db954', '#e91e63'];
  return colors[name.charCodeAt(0) % colors.length];
}

function getAvatarStyle(name: string): Record<string, string> {
  const avatar = getAvatarImage(name);
  if (avatar) {
    return {
      backgroundImage: `url("${avatar}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'transparent',
    };
  }
  return { backgroundColor: getAvatarColor(name) };
}

function getAvatarImage(name: string): string {
  return name === ownerName.value ? (store.getUserAvatar() || store.getAvatar(name)) : store.getAvatar(name);
}

function hasAvatar(name: string): boolean {
  return Boolean(getAvatarImage(name));
}

function pickAvatar(name: string) {
  pendingAvatarName.value = name;
  avatarInputRef.value?.click();
}

async function onAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !pendingAvatarName.value) return;
  if (pendingAvatarName.value === ownerName.value) {
    await store.setUserAvatar(file);
  } else {
    await store.setAvatar(pendingAvatarName.value, file);
  }
  pendingAvatarName.value = '';
  input.value = '';
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000 && date.toDateString() === new Date(now).toDateString()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  if (diff < 604800000) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatMsgTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── 生命周期 ───
onMounted(() => {
  loadConversations();
});

const refreshInterval = setInterval(loadConversations, 5000);
onUnmounted(() => clearInterval(refreshInterval));
</script>

<style scoped>
.qq-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}
.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tab-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
  flex-shrink: 0;
}
.tab-header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.header-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 16px 8px;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: 10px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.clear-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.messages-list {
  flex: 1;
  overflow-y: auto;
}
.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.conversation-item:hover {
  background: var(--bg-hover);
}
.conversation-item.unread {
  background: rgba(0, 122, 255, 0.03);
}
.conversation-item:not(:last-child) {
  border-bottom: 0.5px solid var(--border-secondary);
}
.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}
.conv-content {
  flex: 1;
  min-width: 0;
}
.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.conv-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-time {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preview-text {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 8px;
  padding: 40px;
}
.empty-state.small {
  padding: 20px;
}
.empty-state p {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}
.hint {
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}
.contact-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 0.5px solid var(--border-secondary);
}
.contact-entry:hover {
  background: var(--bg-hover);
}
.entry-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.entry-name {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}
.section-label {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 10px 16px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.contact-list-scroll {
  flex: 1;
  overflow-y: auto;
}
.group-letter {
  padding: 4px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.contact-item:hover {
  background: var(--bg-hover);
}
.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
.contact-info {
  flex: 1;
  min-width: 0;
}
.contact-name {
  font-size: 15px;
  color: var(--text-primary);
  display: block;
}
.contact-tags {
  font-size: 11px;
  color: var(--text-muted);
}
.contact-count {
  padding: 8px 16px;
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}
.moments-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}
.ai-moment-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(87, 155, 240, 0.1), rgba(80, 201, 195, 0.1));
  cursor: pointer;
}
.ai-icon {
  font-size: 20px;
}
.ai-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ai-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}
.ai-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}
.moment-card {
  margin: 0 16px 10px;
  padding: 14px;
  background: var(--bg-grouped, var(--bg-secondary));
  border-radius: 12px;
}
.moment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.moment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
.moment-author-info {
  flex: 1;
}
.moment-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  display: block;
}
.moment-time {
  font-size: 11px;
  color: var(--text-muted);
}
.moment-text {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
}
.moment-images {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.moment-img-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.moment-actions {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 0.5px solid var(--border-secondary);
}
.moment-action {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}
.moment-action.liked {
  color: #fe2c55;
}
.moment-comments {
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--bg-input);
  border-radius: 8px;
}
.moment-comment {
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.5;
}
.moment-comment:last-child {
  margin-bottom: 0;
}
.comment-author {
  color: var(--accent);
  font-weight: 500;
  margin-right: 6px;
}
.comment-text {
  color: var(--text-primary);
}
.me-scroll {
  flex: 1;
  overflow-y: auto;
}
.me-profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin: 8px 16px;
  border-radius: 12px;
  background: var(--bg-grouped, var(--bg-secondary));
  cursor: pointer;
}
.me-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}
.me-info {
  flex: 1;
  min-width: 0;
}
.me-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}
.me-id {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-top: 2px;
}
.me-signature {
  font-size: 12px;
  color: var(--text-tertiary);
  display: block;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me-group {
  margin: 8px 16px;
  background: var(--bg-grouped, var(--bg-secondary));
  border-radius: 12px;
  overflow: hidden;
}
.me-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 0.5px solid var(--border-secondary);
}
.me-item:last-child {
  border-bottom: none;
}
.me-item:hover {
  background: var(--bg-hover);
}
.me-item-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.me-item-label {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}
.back-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.back-btn.spinning svg {
  animation: reroll-spin 0.8s linear infinite;
}
.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
@keyframes reroll-spin {
  to {
    transform: rotate(360deg);
  }
}
.chat-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}
.chat-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 4px;
}
.chat-empty p {
  font-size: 14px;
  margin: 0;
  color: var(--text-secondary);
}
.chat-empty span {
  font-size: 12px;
  color: var(--text-tertiary);
}
.chat-bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 78%;
}
.chat-bubble-wrapper.is-self {
  align-self: flex-end;
  align-items: flex-end;
}
.chat-bubble {
  padding: 9px 14px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.4;
  background: var(--bg-grouped);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
  word-break: break-word;
  white-space: pre-wrap;
}
.chat-bubble.self {
  background: #007aff;
  color: white;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 4px;
}
.chat-sticker {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  max-width: 170px;
  min-width: 54px;
  padding: 2px 0;
  background: transparent;
}
.chat-bubble-wrapper.is-self .chat-sticker {
  justify-content: flex-end;
}
.chat-sticker-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 170px;
  max-height: 170px;
  object-fit: contain;
  border-radius: 8px;
  background: transparent;
}
.inline-sticker-img {
  width: auto;
  height: auto;
  max-width: 46px;
  max-height: 46px;
  object-fit: contain;
  vertical-align: middle;
  margin: 0 3px;
  border-radius: 5px;
}
.sticker-fallback,
.inline-sticker-fallback {
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.sticker-fallback {
  padding: 8px 12px;
  border-radius: 14px;
  background: var(--bg-grouped);
}
.chat-time {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
  padding: 0 4px;
}
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 8px;
  background: var(--bg-primary);
  border-top: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  padding: 8px 14px;
  border: 0.5px solid var(--border-primary);
  border-radius: 20px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}
.chat-input:focus {
  border-color: var(--accent);
}
.send-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #007aff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}
.modal-dialog {
  width: 270px;
  background: var(--bg-card, var(--bg-primary));
  border-radius: 14px;
  overflow: hidden;
  padding: 20px 16px 14px;
}
.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 14px;
}
.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 0.5px solid var(--border-primary);
  border-radius: 10px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}
.modal-input:focus {
  border-color: var(--accent);
}
.modal-error {
  font-size: 12px;
  color: var(--danger);
  margin-top: 6px;
}
.modal-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  justify-content: flex-end;
}
.modal-btn {
  padding: 7px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.modal-btn.cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
.modal-btn.confirm {
  background: var(--accent);
  color: white;
}
.modal-btn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.modal-sheet {
  width: 100%;
  max-height: 80%;
  background: var(--bg-card, var(--bg-primary));
  border-radius: 14px 14px 0 0;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--border-secondary);
}
.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.sheet-cancel {
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
}
.sheet-submit {
  border: none;
  border-radius: 14px;
  padding: 6px 16px;
  background: var(--accent);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sheet-submit:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.friend-request-list {
  max-height: 300px;
  overflow-y: auto;
}
.friend-request-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 0.5px solid var(--border-secondary);
}
.req-info {
  flex: 1;
  min-width: 0;
}
.req-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}
.req-msg {
  font-size: 12px;
  color: var(--text-tertiary);
  display: block;
  margin-top: 2px;
}
.accept-btn {
  border: none;
  border-radius: 14px;
  padding: 5px 14px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.accepted-text {
  font-size: 12px;
  color: var(--text-muted);
}
.group-list {
  max-height: 300px;
  overflow-y: auto;
}
.group-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 0.5px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.15s;
}
.group-item:hover {
  background: var(--bg-hover);
}
.group-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.group-info {
  flex: 1;
  min-width: 0;
}
.group-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}
.group-members {
  font-size: 12px;
  color: var(--text-muted);
}
.member-select-list {
  max-height: 150px;
  overflow-y: auto;
  border: 0.5px solid var(--border-secondary);
  border-radius: 8px;
  margin-bottom: 10px;
}
.member-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--border-secondary);
}
.member-select-item:last-child {
  border-bottom: none;
}
.member-select-item input[type='checkbox'] {
  accent-color: var(--accent);
}
.moment-textarea {
  width: 100%;
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  outline: none;
  box-sizing: border-box;
}
.profile-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}
.profile-header-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}
.profile-header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.profile-scroll {
  flex: 1;
  overflow-y: auto;
}
.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 20px;
  gap: 8px;
}
.avatar,
.contact-avatar,
.moment-avatar,
.me-avatar,
.chat-avatar,
.group-avatar,
.profile-avatar-large {
  background-size: cover;
  background-position: center;
  cursor: pointer;
}

.avatar-file-input {
  display: none;
}

.profile-avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
}
.profile-name-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.profile-alias {
  font-size: 14px;
  color: var(--text-tertiary);
}
.profile-id {
  font-size: 13px;
  color: var(--text-muted);
}
.profile-section {
  margin: 8px 16px;
  background: var(--bg-grouped, var(--bg-secondary));
  border-radius: 12px;
  overflow: hidden;
}
.profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 0.5px solid var(--border-secondary);
}
.profile-row:last-child {
  border-bottom: none;
}
.profile-row.clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.profile-row.clickable:hover {
  background: var(--bg-hover);
}
.profile-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-right: 12px;
}
.profile-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-value-short {
  font-size: 14px;
  color: var(--text-muted);
}
.profile-row-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.profile-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  background: rgba(0, 122, 255, 0.1);
  color: var(--accent);
  margin-left: 4px;
}
.profile-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
}
.profile-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.profile-action-btn.primary {
  background: var(--accent);
  color: white;
}
.profile-action-btn.secondary {
  background: var(--bg-grouped, var(--bg-secondary));
  color: var(--text-primary);
}
.profile-action-btn:hover {
  opacity: 0.85;
}
.blocked-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 6px 12px;
  background: rgba(255, 59, 48, 0.08);
  color: var(--danger);
  font-size: 12px;
  flex-shrink: 0;
}
.chat-system-msg {
  text-align: center;
  padding: 4px 0;
}
.chat-system-msg span {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 2px 10px;
  border-radius: 10px;
}
.chat-read-receipt {
  text-align: right;
  padding: 2px 4px;
}
.chat-read-receipt span {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}
.flash-photo-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 14px;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.flash-photo-bubble.viewed {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: default;
}
.flash-photo-bubble:not(.viewed):hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.flash-overlay {
  position: absolute;
  inset: 0;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.flash-content {
  text-align: center;
  padding: 30px;
  max-width: 80%;
}
.flash-timer {
  font-size: 48px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}
.flash-text {
  font-size: 16px;
  color: white;
  line-height: 1.6;
  margin: 0 0 12px;
  white-space: pre-wrap;
}
.flash-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px !important;
}
.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
