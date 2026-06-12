import { Router, Request, Response } from 'express';
import { config } from '../config';
import { getOptionalUser, requireAuth } from '../auth/middleware';
import { nowIso, recordAuditLog } from '../audit';
import {
  createWork,
  getDb,
  isAdmin,
  type DbUser,
} from '../database';
import { DEFAULT_CULTIVATION_WORLD_MODULES } from '../defaultCultivationWorldModules';

const router = Router();

const MODULE_FILE_TYPE = 'json:cultivation_world_module';
const VALID_KINDS = new Set([
  'continent',
  'sea',
  'region',
  'settlement',
  'sect',
  'secret_realm',
  'npc',
  'encounter',
  'resource',
  'quest_seed',
]);

type ReviewStatus = 'pending_review' | 'approved' | 'rejected';

interface ModuleRow {
  id: number;
  user_id: number;
  title: string;
  description: string;
  content: string;
  tags: string;
  status: string;
  visibility: string;
  reject_reason: string;
  last_version_no: number;
  updated_at: string;
  reviewed_at: string;
  author_username: string;
  author_display_name: string;
  author_role: string;
  reviewer_username?: string;
  reviewer_display_name?: string;
}

function pageNumber(value: unknown, fallback: number): number {
  const parsed = parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeTags(value: unknown): string[] {
  return safeArray(value)
    .filter(item => typeof item === 'string')
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return safeTags(parsed);
  } catch {
    return [];
  }
}

function displayName(user: Pick<DbUser, 'discord_username' | 'discord_display_name'>): string {
  return user.discord_display_name || user.discord_username;
}

function reviewStatusFromWork(status: string): ReviewStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending_review';
}

function parseModuleContent(row: ModuleRow): any | undefined {
  try {
    const stored = JSON.parse(row.content || '{}');
    const content = stored?.content?.schema === 'cultivation_world_module_v1'
      ? stored.content
      : stored?.schema === 'cultivation_world_module_v1'
        ? stored
        : undefined;
    if (!content) return undefined;
    return {
      stored,
      content,
    };
  } catch {
    return undefined;
  }
}

function publicModulePayload(module: any, includeContent: boolean) {
  const summary = {
    id: module.id,
    version: module.version,
    title: module.title,
    kind: module.kind,
    tags: safeTags(module.tags),
    authorName: module.authorName,
    description: module.description,
    updatedAtIso: module.updatedAtIso,
    reviewStatus: 'approved' as const,
    reviewedBy: module.reviewedBy || 'system',
    reviewedAtIso: module.reviewedAtIso || module.updatedAtIso,
  };
  if (!includeContent) return summary;
  return {
    ...summary,
    content: {
      schema: 'cultivation_world_module_v1' as const,
      checksum: module.content?.checksum || module.version,
      dependencies: safeArray(module.content?.dependencies).filter(item => typeof item === 'string'),
      entries: safeArray(module.content?.entries).map((entry: any) => ({
        id: String(entry.id || `${module.id}-entry`),
        sourceModuleId: module.id,
        kind: VALID_KINDS.has(entry.kind) ? entry.kind : module.kind,
        label: String(entry.label || module.title),
        yamlText: String(entry.yamlText || ''),
        tags: safeTags(entry.tags),
      })),
    },
  };
}

function builtInModuleMatches(req: Request, module: any, kind: string): boolean {
  if (kind && module.kind !== kind) return false;

  const tag = String(req.query.tag || '').trim();
  const tags = safeTags(module.tags);
  if (tag && !tags.includes(tag)) return false;

  const search = String(req.query.search || '').trim();
  if (!search) return true;

  const text = [
    module.title,
    module.description,
    module.authorName,
    ...tags,
    ...safeArray(module.content?.entries).flatMap((entry: any) => [
      entry.label,
      entry.kind,
      ...safeTags(entry.tags),
      entry.yamlText,
    ]),
  ].join('\n');
  return text.includes(search);
}

function modulePayload(row: ModuleRow, includeContent: boolean) {
  const parsed = parseModuleContent(row);
  if (!parsed) return undefined;
  const moduleId = `work-${row.id}`;
  const kind = String(parsed.stored.kind || parsed.content.entries?.[0]?.kind || '');
  if (!VALID_KINDS.has(kind)) return undefined;
  const tags = parseTags(row.tags);
  const summary = {
    id: moduleId,
    version: `v${row.last_version_no || 1}`,
    title: row.title,
    kind,
    tags,
    authorName: parsed.stored.authorName || row.author_display_name || row.author_username,
    description: row.description,
    updatedAtIso: row.updated_at,
    reviewStatus: reviewStatusFromWork(row.status),
    reviewedBy: row.reviewer_display_name || row.reviewer_username || '',
    reviewedAtIso: row.reviewed_at || '',
  };

  if (!includeContent) return summary;

  return {
    ...summary,
    content: {
      schema: 'cultivation_world_module_v1',
      checksum: parsed.content.checksum || '',
      dependencies: safeArray(parsed.content.dependencies).filter(item => typeof item === 'string'),
      entries: safeArray(parsed.content.entries).map((entry: any) => ({
        id: String(entry.id || `${moduleId}-entry`),
        sourceModuleId: moduleId,
        kind: VALID_KINDS.has(entry.kind) ? entry.kind : kind,
        label: String(entry.label || row.title),
        yamlText: String(entry.yamlText || ''),
        tags: safeTags(entry.tags),
      })),
    },
  };
}

function searchRows(req: Request, status: ReviewStatus, user?: DbUser): ModuleRow[] {
  const where = [
    'w.type = ?',
    'w.file_type = ?',
    'w.visibility = ?',
  ];
  const params: unknown[] = ['worldbook', MODULE_FILE_TYPE, 'public'];

  if (status === 'approved') {
    where.push('w.status = ?');
    params.push('approved');
  } else {
    where.push('w.status = ?');
    params.push(status === 'rejected' ? 'rejected' : 'pending');
    if (!user || !isAdmin(user)) {
      where.push('w.user_id = ?');
      params.push(user?.id || -1);
    }
  }

  if (req.query.official_only === 'true') {
    where.push("u.role = 'admin'");
  }

  const search = String(req.query.search || '').trim();
  if (search) {
    where.push('(w.title LIKE ? OR w.description LIKE ? OR w.tags LIKE ? OR u.discord_username LIKE ? OR u.discord_display_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const tag = String(req.query.tag || '').trim();
  if (tag) {
    where.push('w.tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  return getDb().prepare(`
    SELECT
      w.*,
      u.discord_username as author_username,
      u.discord_display_name as author_display_name,
      u.role as author_role,
      reviewer.discord_username as reviewer_username,
      reviewer.discord_display_name as reviewer_display_name
    FROM works w
    JOIN users u ON u.id = w.user_id
    LEFT JOIN users reviewer ON reviewer.id = w.reviewed_by
    WHERE ${where.join(' AND ')}
    ORDER BY w.updated_at DESC, w.id DESC
    LIMIT 500
  `).all(...params) as ModuleRow[];
}

router.get('/modules', (req: Request, res: Response) => {
  const requestedStatus = String(req.query.review_status || 'approved') as ReviewStatus;
  const reviewStatus: ReviewStatus = ['pending_review', 'approved', 'rejected'].includes(requestedStatus)
    ? requestedStatus
    : 'approved';
  const user = getOptionalUser(req);

  if (reviewStatus !== 'approved' && !user) {
    res.status(401).json({ error: '查看待审或驳回模块需要先登录' });
    return;
  }

  const kind = String(req.query.kind || '').trim();
  const page = pageNumber(req.query.page, 1);
  const pageSize = Math.min(50, pageNumber(req.query.page_size, 12));
  const rows = searchRows(req, reviewStatus, user);
  const builtInModules = reviewStatus === 'approved'
    ? DEFAULT_CULTIVATION_WORLD_MODULES
        .filter(module => builtInModuleMatches(req, module, kind))
        .map(module => publicModulePayload(module, false))
    : [];
  const modules = [
    ...builtInModules,
    ...rows
    .map(row => modulePayload(row, false))
    .filter(Boolean)
      .filter((item: any) => !kind || item.kind === kind),
  ];
  const start = (page - 1) * pageSize;
  const pageItems = modules.slice(start, start + pageSize);

  res.json({
    modules: pageItems,
    total: modules.length,
    page,
    pageSize,
    page_size: pageSize,
    totalPages: Math.ceil(modules.length / pageSize),
    total_pages: Math.ceil(modules.length / pageSize),
  });
});

router.get('/modules/:id/download', (req: Request, res: Response) => {
  const rawId = String(req.params.id || '');
  const builtInModule = DEFAULT_CULTIVATION_WORLD_MODULES.find(module => module.id === rawId);
  if (builtInModule) {
    recordAuditLog({
      req,
      category: 'system',
      action: 'cultivation_world_builtin_module_downloaded',
      entityType: 'cultivation_world_builtin_module',
      entityId: builtInModule.id,
      detail: { 模块标题: builtInModule.title, 模块ID: builtInModule.id },
    });
    res.json(publicModulePayload(builtInModule, true));
    return;
  }

  const workId = rawId.startsWith('work-') ? parseInt(rawId.slice(5), 10) : parseInt(rawId, 10);
  if (!Number.isFinite(workId) || workId <= 0) {
    res.status(404).json({ error: '世界模块不存在' });
    return;
  }

  const row = getDb().prepare(`
    SELECT
      w.*,
      u.discord_username as author_username,
      u.discord_display_name as author_display_name,
      u.role as author_role,
      reviewer.discord_username as reviewer_username,
      reviewer.discord_display_name as reviewer_display_name
    FROM works w
    JOIN users u ON u.id = w.user_id
    LEFT JOIN users reviewer ON reviewer.id = w.reviewed_by
    WHERE w.id = ? AND w.type = 'worldbook' AND w.file_type = ? AND w.visibility = 'public'
  `).get(workId, MODULE_FILE_TYPE) as ModuleRow | undefined;

  const user = getOptionalUser(req);
  if (!row || (row.status !== 'approved' && (!user || (user.id !== row.user_id && !isAdmin(user))))) {
    res.status(404).json({ error: '世界模块不存在或尚未通过审核' });
    return;
  }

  const payload = modulePayload(row, true);
  if (!payload) {
    res.status(500).json({ error: '世界模块内容损坏' });
    return;
  }

  recordAuditLog({
    req,
    category: 'system',
    action: 'cultivation_world_module_downloaded',
    entityType: 'work',
    entityId: row.id,
    targetUserId: row.user_id,
    detail: { 模块标题: row.title, 模块ID: `work-${row.id}` },
  });

  res.json(payload);
});

router.post('/submissions', requireAuth, (req: Request, res: Response) => {
  const body = req.body || {};
  if (body.schema !== 'cultivation_world_module_submission_v1') {
    res.status(400).json({ error: '世界模块投稿 schema 不匹配' });
    return;
  }

  const title = String(body.title || '').trim();
  const kind = String(body.kind || '').trim();
  const description = String(body.description || '').trim();
  if (!title) { res.status(400).json({ error: '标题不能为空' }); return; }
  if (!VALID_KINDS.has(kind)) { res.status(400).json({ error: '世界模块类型无效' }); return; }
  if (body.content?.schema !== 'cultivation_world_module_v1') {
    res.status(400).json({ error: '世界模块内容 schema 不匹配' });
    return;
  }

  const entries = safeArray(body.content.entries);
  if (entries.length === 0) {
    res.status(400).json({ error: '世界模块至少需要一个条目' });
    return;
  }

  const now = nowIso();
  const authorName = String(body.authorName || displayName(req.user!)).trim().slice(0, 80);
  const moduleContent = {
    schema: 'cultivation_world_module_v1',
    dependencies: safeArray(body.content.dependencies).filter(item => typeof item === 'string').slice(0, 30),
    entries: entries.slice(0, 120).map((entry: any, index) => ({
      id: String(entry.id || `entry-${index + 1}`).slice(0, 120),
      kind: VALID_KINDS.has(entry.kind) ? entry.kind : kind,
      label: String(entry.label || title).slice(0, 120),
      yamlText: String(entry.yamlText || '').slice(0, config.maxContentSize),
      tags: safeTags(entry.tags),
    })),
  };
  const stored = {
    schema: 'cultivation_world_server_module_v1',
    kind,
    authorName,
    submittedAtIso: now,
    content: moduleContent,
  };
  const content = JSON.stringify(stored);
  if (Buffer.byteLength(content, 'utf8') > config.maxContentSize) {
    res.status(400).json({ error: '世界模块内容过大，最大 1MB' });
    return;
  }

  const workId = createWork(
    req.user!.id,
    title.slice(0, 120),
    '',
    description.slice(0, 1000),
    'worldbook',
    content,
    safeTags(body.tags),
    '',
    '',
    MODULE_FILE_TYPE,
  );

  recordAuditLog({
    req,
    category: 'system',
    action: 'cultivation_world_module_submitted',
    entityType: 'work',
    entityId: workId,
    detail: { 模块标题: title, 类型: kind, 作者名: authorName },
  });

  res.status(201).json({
    submissionId: `work-${workId}`,
    reviewStatus: 'pending_review',
  });
});

export default router;
