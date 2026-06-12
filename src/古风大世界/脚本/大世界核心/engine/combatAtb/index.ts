import { createId } from '../../state/defaults';
import type {
  BattleAutoAdvanceOptions,
  BattleCommand,
  BattleCommandResolution,
  BattleEffect,
  BattleEventRecord,
  BattleResult,
  BattleSetup,
  BattleState,
  BattleStatusInstance,
  BattleTickResult,
  BattleUnitSnapshot,
  BattleUnitState,
  CommandValidationResult,
  CombatSide,
  ReadyQueueEntry,
  StrengthLockOptions,
  UnitBattleResult,
} from '../../types/combat';

const DEFAULT_GAUGE_MAX = 10000;
const DEFAULT_TICK_DELTA = 50;
const DEFAULT_TICK_SCALE = 1;
const DEFAULT_STRENGTH_LOCK: StrengthLockOptions = {
  enabled: true,
  minimumLockPower: 60,
  lockBand: 12,
  allowAssassinationBypass: false,
};

export function createBattleState(setup: BattleSetup): BattleState {
  const battleId = setup.battleId ?? createId('battle');
  const units = [
    ...setup.playerUnits,
    ...(setup.allyUnits ?? []),
    ...setup.enemyUnits,
    ...(setup.neutralUnits ?? []),
  ].map(createUnitState);

  const state: BattleState = {
    battleId,
    locationId: setup.locationId ?? 'unknown',
    environmentId: setup.environmentId ?? 'default',
    difficultyId: setup.difficultyId ?? 'normal',
    objective: setup.objective,
    strengthLock: { ...DEFAULT_STRENGTH_LOCK, ...(setup.strengthLock ?? {}) },
    units,
    readyQueue: [],
    tick: 0,
    outcome: 'ongoing',
    result: null,
    eventLog: [],
  };

  assertUniqueUnitIds(state);
  refreshStrengthLocks(state);
  addBattleEvent(state, 'battle_created', undefined, [], `战斗建立：${battleId}`);
  return state;
}

export function tickBattleState(state: BattleState, deltaTime = DEFAULT_TICK_DELTA): BattleTickResult {
  if (state.outcome !== 'ongoing') {
    return { tick: state.tick, deltaTime: 0, readiedUnitIds: [] };
  }
  if (!Number.isFinite(deltaTime) || deltaTime < 0) {
    throw new Error('战斗时间推进必须是非负数');
  }
  if (deltaTime > 0 && state.readyQueue.length > 0) {
    throw new Error('待行动队列非空时不能继续推进时间');
  }

  state.tick += 1;
  const readiedUnitIds: string[] = [];
  for (const unit of state.units) {
    if (!canGainGauge(unit) || isUnitReady(state, unit.snapshot.unitId)) continue;
    const gaugeMax = normalizeGaugeMax(unit.actionGaugeMax);
    unit.actionGaugeMax = gaugeMax;
    unit.actionGauge += unit.snapshot.speed * DEFAULT_TICK_SCALE * deltaTime * getGaugeMultiplier(unit);
    if (unit.actionGauge >= gaugeMax) {
      const overflow = unit.actionGauge - gaugeMax;
      unit.actionGauge = gaugeMax;
      state.readyQueue.push({
        unitId: unit.snapshot.unitId,
        overflow,
        speed: unit.snapshot.speed,
        awareness: unit.snapshot.awareness,
        tick: state.tick,
      });
      readiedUnitIds.push(unit.snapshot.unitId);
      addBattleEvent(state, 'unit_ready', unit.snapshot.unitId, [], `${unit.snapshot.displayName}获得行动机会`);
    }
  }
  sortReadyQueue(state.readyQueue);
  return { tick: state.tick, deltaTime, readiedUnitIds };
}

export function getReadyActor(state: BattleState): BattleUnitState | null {
  const entry = state.readyQueue[0];
  return entry ? findUnit(state, entry.unitId) : null;
}

export function getLegalTargets(state: BattleState, actorUnitId: string, command: BattleCommand): string[] {
  const actor = requireUnit(state, actorUnitId);
  if (!actor.alive || actor.escaped) return [];

  if (command.kind === 'defend' || command.kind === 'wait' || command.kind === 'escape') {
    return [actor.snapshot.unitId];
  }
  if (command.kind === 'guard') {
    return getAliveUnits(state).filter(unit => isSameCamp(actor.snapshot.side, unit.snapshot.side)).map(unit => unit.snapshot.unitId);
  }
  if (command.kind === 'item' && command.effects?.some(effect => effect.kind === 'heal')) {
    return getAliveUnits(state).filter(unit => isSameCamp(actor.snapshot.side, unit.snapshot.side)).map(unit => unit.snapshot.unitId);
  }

  const enemyTargets = getAliveUnits(state)
    .filter(unit => isHostile(actor.snapshot.side, unit.snapshot.side))
    .map(unit => unit.snapshot.unitId);
  return applyStrengthLock(state, actor, enemyTargets, command);
}

export function validateBattleCommand(state: BattleState, command: BattleCommand): CommandValidationResult {
  if (state.outcome !== 'ongoing') {
    return failValidation('blocked_by_battle_finished', '战斗已结束');
  }

  const actor = findUnit(state, command.actorUnitId);
  if (!actor || !actor.alive || actor.escaped) {
    return failValidation('blocked_by_actor_missing_or_down', '行动者不存在或已失去战斗能力');
  }
  if (!isUnitReady(state, actor.snapshot.unitId)) {
    return failValidation('blocked_by_actor_not_ready', '行动者尚未获得行动机会');
  }
  if (!actor.canAct || hasStatusTag(actor, 'stun')) {
    return failValidation('blocked_by_status_stun', '行动者被控制，无法行动');
  }
  if ((command.innerPowerCost ?? getDefaultCost(command).innerPowerCost) > actor.currentInnerPower) {
    return failValidation('blocked_by_insufficient_inner_power', '内力不足');
  }

  const sourceId = command.sourceId ?? command.kind;
  if ((actor.cooldowns[sourceId] ?? 0) > 0) {
    return failValidation('blocked_by_cooldown', '指令仍在冷却');
  }

  const legalTargetUnitIds = getLegalTargets(state, actor.snapshot.unitId, command);
  const requestedTargets = command.targetUnitIds && command.targetUnitIds.length > 0 ? command.targetUnitIds : legalTargetUnitIds.slice(0, 1);
  if (requestedTargets.length === 0 || requestedTargets.some(targetId => !legalTargetUnitIds.includes(targetId))) {
    return {
      ok: false,
      reasonId: 'blocked_by_strength_lock_or_invalid_target',
      message: '目标不合法，或被强者牵制锁限制',
      legalTargetUnitIds,
    };
  }

  return { ok: true, message: '指令合法', legalTargetUnitIds };
}

export function resolveBattleCommand(state: BattleState, command: BattleCommand): BattleCommandResolution {
  const validation = validateBattleCommand(state, command);
  if (!validation.ok) {
    return { ok: false, validation, state, message: validation.message };
  }

  const actor = requireUnit(state, command.actorUnitId);
  const cost = getDefaultCost(command);
  const targetIds = command.targetUnitIds && command.targetUnitIds.length > 0 ? command.targetUnitIds : validation.legalTargetUnitIds?.slice(0, 1) ?? [];
  actor.currentInnerPower = clamp(actor.currentInnerPower - (command.innerPowerCost ?? cost.innerPowerCost), 0, actor.snapshot.maxInnerPower);
  consumeActionGauge(state, actor, command.actionGaugeCost ?? cost.actionGaugeCost);

  const effects = command.effects && command.effects.length > 0 ? command.effects : getDefaultEffects(command, actor);
  for (const effect of effects) {
    applyEffect(state, actor, targetIds, effect);
  }

  const sourceId = command.sourceId ?? command.kind;
  const cooldownTicks = command.cooldownTicks ?? cost.cooldownTicks;
  if (cooldownTicks > 0) actor.cooldowns[sourceId] = cooldownTicks;

  tickStatusesAndCooldowns(state, actor);
  refreshStrengthLocks(state);
  const result = checkBattleResult(state);
  const message = `${actor.snapshot.displayName}执行${command.kind}`;
  addBattleEvent(state, 'command_resolved', actor.snapshot.unitId, targetIds, message, { commandKind: command.kind });
  return { ok: true, validation, state, result: result ?? undefined, message };
}

export function autoAdvanceBattle(state: BattleState, options: BattleAutoAdvanceOptions = {}): BattleState {
  const maxSteps = options.maxSteps ?? 40;
  const tickDeltaTime = options.tickDeltaTime ?? DEFAULT_TICK_DELTA;
  let steps = 0;
  while (state.outcome === 'ongoing' && steps < maxSteps) {
    if (state.readyQueue.length === 0) {
      tickBattleState(state, tickDeltaTime);
      steps += 1;
      continue;
    }

    const actor = getReadyActor(state);
    if (!actor) {
      state.readyQueue.shift();
      steps += 1;
      continue;
    }

    const command = chooseAutoCommand(state, actor);
    resolveBattleCommand(state, command);
    steps += 1;
  }
  return state;
}

export function findUnit(state: BattleState, unitId: string): BattleUnitState | null {
  return state.units.find(unit => unit.snapshot.unitId === unitId) ?? null;
}

export function getAliveUnits(state: BattleState, side?: CombatSide): BattleUnitState[] {
  return state.units.filter(unit => unit.alive && !unit.escaped && (!side || unit.snapshot.side === side));
}

export function finalizeBattleResult(state: BattleState, outcome: BattleResult['outcome']): BattleResult {
  state.outcome = outcome;
  const result: BattleResult = {
    battleId: state.battleId,
    outcome,
    escaped: outcome === 'escape',
    interrupted: outcome === 'interrupt',
    unitResults: state.units.map(toUnitBattleResult),
    rewardRequests: [],
    relationshipSuggestions: [],
    worldEventSuggestions: [],
    eventLog: state.eventLog,
    summary: buildBattleResultSummary(state, outcome),
  };
  state.result = result;
  addBattleEvent(state, 'battle_finished', undefined, [], result.summary);
  return result;
}

function createUnitState(snapshot: BattleUnitSnapshot): BattleUnitState {
  const actionGaugeMax = normalizeGaugeMax(snapshot.actionGaugeMax ?? DEFAULT_GAUGE_MAX);
  return {
    snapshot: {
      ...snapshot,
      armor: snapshot.armor ?? 0,
      weaponCondition: snapshot.weaponCondition ?? 100,
      methodIds: snapshot.methodIds ?? [],
      itemIds: snapshot.itemIds ?? [],
      longTermStateIds: snapshot.longTermStateIds ?? [],
      roleTags: snapshot.roleTags ?? [],
    },
    currentHealth: Math.max(1, snapshot.maxHealth),
    currentInnerPower: Math.max(0, snapshot.maxInnerPower),
    actionGauge: 0,
    actionGaugeMax,
    alive: true,
    canAct: true,
    escaped: false,
    statuses: [],
    cooldowns: {},
    lockedTargetUnitIds: [],
  };
}

function applyStrengthLock(
  state: BattleState,
  actor: BattleUnitState,
  candidateIds: string[],
  command: BattleCommand,
): string[] {
  if (!state.strengthLock.enabled || command.kind === 'escape') return candidateIds;
  if (command.kind === 'skill' && state.strengthLock.allowAssassinationBypass && command.sourceId?.includes('assassinate')) {
    return candidateIds;
  }

  const actorPower = getLockPower(actor);
  if (actorPower < state.strengthLock.minimumLockPower) return candidateIds;

  const candidates = candidateIds.map(unitId => requireUnit(state, unitId));
  const lockers = candidates.filter(unit => canExertStrengthLock(unit, state.strengthLock) && getLockPower(unit) >= actorPower - state.strengthLock.lockBand);
  if (lockers.length === 0) return candidateIds;

  const maxPower = Math.max(...lockers.map(getLockPower));
  return lockers.filter(unit => getLockPower(unit) >= maxPower - state.strengthLock.lockBand).map(unit => unit.snapshot.unitId);
}

function refreshStrengthLocks(state: BattleState): void {
  for (const unit of state.units) {
    if (!unit.alive || unit.escaped) {
      unit.lockedTargetUnitIds = [];
      continue;
    }
    unit.lockedTargetUnitIds = applyStrengthLock(
      state,
      unit,
      getAliveUnits(state)
        .filter(target => isHostile(unit.snapshot.side, target.snapshot.side))
        .map(target => target.snapshot.unitId),
      { actorUnitId: unit.snapshot.unitId, kind: 'basic_attack' },
    );
  }
}

function canExertStrengthLock(unit: BattleUnitState, options: StrengthLockOptions): boolean {
  if (!unit.alive || unit.escaped || hasStatusTag(unit, 'stun') || hasStatusTag(unit, 'restrained')) return false;
  if (unit.snapshot.canExertStrengthLock === false) return false;
  return getLockPower(unit) >= options.minimumLockPower || unit.snapshot.role === 'guard' || unit.snapshot.role === 'commander';
}

function getLockPower(unit: BattleUnitState): number {
  const guardBonus = unit.snapshot.role === 'guard' ? 6 : 0;
  const commanderBonus = unit.snapshot.role === 'commander' ? 4 : 0;
  const moraleBonus = Math.max(0, unit.snapshot.morale - 50) / 10;
  return Math.max(unit.snapshot.powerTier, unit.snapshot.lockPower ?? 0) + guardBonus + commanderBonus + moraleBonus;
}

function applyEffect(state: BattleState, actor: BattleUnitState, selectedTargetIds: string[], effect: BattleEffect): void {
  const targets = resolveEffectTargets(state, actor, selectedTargetIds, effect);
  for (const target of targets) {
    if (effect.kind === 'damage') {
      applyDamage(state, actor, target, effect);
    } else if (effect.kind === 'heal') {
      applyHeal(state, actor, target, effect);
    } else if (effect.kind === 'shield' || effect.kind === 'status') {
      applyStatus(state, actor, target, effect);
    } else if (effect.kind === 'gauge_pull') {
      target.actionGauge = clamp(target.actionGauge + readEffectAmount(effect, actor, target), 0, target.actionGaugeMax);
      enqueueIfReady(state, target);
    } else if (effect.kind === 'gauge_pushback') {
      target.actionGauge = clamp(target.actionGauge - readEffectAmount(effect, actor, target), 0, target.actionGaugeMax);
      clearReadyState(state, target.snapshot.unitId);
    } else if (effect.kind === 'guard') {
      target.guardingUnitId = actor.snapshot.unitId;
      applyStatus(state, actor, actor, {
        kind: 'status',
        target: 'self',
        status: {
          statusId: 'guarding',
          kind: 'guard',
          stacks: 1,
          durationTicks: 2,
          potency: 1,
          tags: ['guard'],
        },
      });
    } else if (effect.kind === 'escape') {
      tryEscape(state, actor);
    }
  }
}

function applyDamage(state: BattleState, actor: BattleUnitState, target: BattleUnitState, effect: BattleEffect): void {
  const raw = readEffectAmount(effect, actor, target);
  const defendMultiplier = hasStatusTag(target, 'defend') ? 0.55 : 1;
  const shieldValue = getShieldValue(target);
  const armor = target.snapshot.armor ?? 0;
  const mitigated = Math.max(1, raw * defendMultiplier - target.snapshot.defense * 0.35 - armor * 0.2);
  const shieldAbsorbed = Math.min(shieldValue, mitigated);
  if (shieldAbsorbed > 0) reduceShield(target, shieldAbsorbed);
  const damage = Math.max(0, Math.floor(mitigated - shieldAbsorbed));
  target.currentHealth = clamp(target.currentHealth - damage, 0, target.snapshot.maxHealth);
  addBattleEvent(state, 'damage', actor.snapshot.unitId, [target.snapshot.unitId], `${actor.snapshot.displayName}造成${damage}伤害`);
  if (target.currentHealth <= 0) {
    target.alive = false;
    target.canAct = false;
    clearReadyState(state, target.snapshot.unitId);
    addBattleEvent(state, 'unit_down', actor.snapshot.unitId, [target.snapshot.unitId], `${target.snapshot.displayName}倒下`);
  }
}

function applyHeal(state: BattleState, actor: BattleUnitState, target: BattleUnitState, effect: BattleEffect): void {
  const heal = Math.max(0, Math.floor(readEffectAmount(effect, actor, target)));
  target.currentHealth = clamp(target.currentHealth + heal, 0, target.snapshot.maxHealth);
  addBattleEvent(state, 'heal', actor.snapshot.unitId, [target.snapshot.unitId], `${target.snapshot.displayName}恢复${heal}气血`);
}

function applyStatus(state: BattleState, actor: BattleUnitState, target: BattleUnitState, effect: BattleEffect): void {
  if (!effect.status) return;
  const status: BattleStatusInstance = {
    ...effect.status,
    sourceUnitId: actor.snapshot.unitId,
    stacks: Math.max(1, effect.status.stacks),
    durationTicks: Math.max(1, effect.status.durationTicks),
    potency: Math.max(0, effect.status.potency),
  };
  const existingIndex = target.statuses.findIndex(item => item.statusId === status.statusId);
  if (existingIndex >= 0) {
    target.statuses[existingIndex] = {
      ...status,
      stacks: Math.min(5, target.statuses[existingIndex].stacks + status.stacks),
      durationTicks: Math.max(target.statuses[existingIndex].durationTicks, status.durationTicks),
    };
  } else {
    target.statuses.push(status);
  }
  addBattleEvent(state, 'status_apply', actor.snapshot.unitId, [target.snapshot.unitId], `${target.snapshot.displayName}获得状态：${status.statusId}`);
}

function resolveEffectTargets(state: BattleState, actor: BattleUnitState, selectedTargetIds: string[], effect: BattleEffect): BattleUnitState[] {
  if (effect.target === 'self') return [actor];
  if (effect.target === 'selected') return selectedTargetIds.map(unitId => findUnit(state, unitId)).filter(Boolean) as BattleUnitState[];
  if (effect.target === 'all_allies') return getAliveUnits(state).filter(unit => isSameCamp(actor.snapshot.side, unit.snapshot.side));
  return getAliveUnits(state).filter(unit => isHostile(actor.snapshot.side, unit.snapshot.side));
}

function readEffectAmount(effect: BattleEffect, actor: BattleUnitState, target: BattleUnitState): number {
  if (effect.amount !== undefined) return effect.amount;
  if (effect.ratio !== undefined) return target.snapshot.maxHealth * effect.ratio;
  if (effect.kind === 'damage') {
    const powerGap = (actor.snapshot.powerTier - target.snapshot.powerTier) * 0.8;
    const weapon = Math.max(10, actor.snapshot.weaponCondition ?? 100) / 100;
    return Math.max(1, actor.snapshot.attack * weapon + actor.snapshot.technique * 0.35 + powerGap);
  }
  if (effect.kind === 'heal') return actor.snapshot.technique * 0.8 + actor.snapshot.awareness * 0.2;
  return 2000;
}

function getDefaultCost(command: BattleCommand): { innerPowerCost: number; actionGaugeCost: number; cooldownTicks: number } {
  if (command.kind === 'defend') return { innerPowerCost: 0, actionGaugeCost: 5000, cooldownTicks: 0 };
  if (command.kind === 'guard') return { innerPowerCost: 5, actionGaugeCost: 8000, cooldownTicks: 1 };
  if (command.kind === 'wait') return { innerPowerCost: 0, actionGaugeCost: 3500, cooldownTicks: 0 };
  if (command.kind === 'skill') return { innerPowerCost: 15, actionGaugeCost: 10000, cooldownTicks: 2 };
  if (command.kind === 'item') return { innerPowerCost: 0, actionGaugeCost: 9000, cooldownTicks: 1 };
  if (command.kind === 'escape') return { innerPowerCost: 8, actionGaugeCost: 10000, cooldownTicks: 1 };
  return { innerPowerCost: 0, actionGaugeCost: 10000, cooldownTicks: 0 };
}

function getDefaultEffects(command: BattleCommand, actor: BattleUnitState): BattleEffect[] {
  if (command.kind === 'defend') {
    return [
      {
        kind: 'status',
        target: 'self',
        status: {
          statusId: 'defend',
          kind: 'stance',
          stacks: 1,
          durationTicks: 2,
          potency: 1,
          tags: ['defend'],
        },
      },
    ];
  }
  if (command.kind === 'guard') {
    return [{ kind: 'guard', target: 'selected' }];
  }
  if (command.kind === 'wait') {
    return [{ kind: 'gauge_pull', target: 'self', amount: Math.floor(actor.actionGaugeMax * 0.25) }];
  }
  if (command.kind === 'escape') {
    return [{ kind: 'escape', target: 'self' }];
  }
  if (command.kind === 'item') {
    return [{ kind: 'heal', target: 'selected', amount: 25 + actor.snapshot.technique * 0.4 }];
  }
  if (command.kind === 'skill') {
    return [{ kind: 'damage', target: 'selected', amount: actor.snapshot.attack * 1.45 + actor.snapshot.technique * 0.65 }];
  }
  return [{ kind: 'damage', target: 'selected' }];
}

function chooseAutoCommand(state: BattleState, actor: BattleUnitState): BattleCommand {
  if (actor.currentHealth / actor.snapshot.maxHealth < 0.25 && actor.snapshot.side === 'enemy') {
    return { actorUnitId: actor.snapshot.unitId, kind: 'defend' };
  }
  const command: BattleCommand = { actorUnitId: actor.snapshot.unitId, kind: 'basic_attack' };
  const targets = getLegalTargets(state, actor.snapshot.unitId, command);
  return { ...command, targetUnitIds: targets.slice(0, 1) };
}

function checkBattleResult(state: BattleState): BattleResult | null {
  if (state.outcome !== 'ongoing') return state.result;
  const playerAlive = state.units.some(unit => (unit.snapshot.side === 'player' || unit.snapshot.side === 'ally') && unit.alive && !unit.escaped);
  const enemyAlive = state.units.some(unit => unit.snapshot.side === 'enemy' && unit.alive && !unit.escaped);
  if (!enemyAlive) return finalizeBattleResult(state, 'victory');
  if (!playerAlive) return finalizeBattleResult(state, 'defeat');
  if (state.objective.kind === 'survive_ticks' && state.tick >= (state.objective.surviveTicks ?? 0)) {
    return finalizeBattleResult(state, 'victory');
  }
  return null;
}

function tryEscape(state: BattleState, actor: BattleUnitState): void {
  const pursuers = getAliveUnits(state).filter(unit => isHostile(actor.snapshot.side, unit.snapshot.side));
  const pursuitScore = pursuers.reduce((sum, unit) => sum + unit.snapshot.speed + unit.snapshot.awareness * 0.5, 0) / Math.max(1, pursuers.length);
  const escapeScore = actor.snapshot.speed + actor.snapshot.awareness * 0.6 + actor.snapshot.technique * 0.25 - getLockPressure(state, actor);
  if (escapeScore >= pursuitScore) {
    actor.escaped = true;
    actor.canAct = false;
    clearReadyState(state, actor.snapshot.unitId);
    addBattleEvent(state, 'escape_success', actor.snapshot.unitId, [], `${actor.snapshot.displayName}脱离战场`);
    if (actor.snapshot.side === 'player') finalizeBattleResult(state, 'escape');
  } else {
    addBattleEvent(state, 'escape_failed', actor.snapshot.unitId, [], `${actor.snapshot.displayName}脱离失败`);
  }
}

function getLockPressure(state: BattleState, actor: BattleUnitState): number {
  return actor.lockedTargetUnitIds.reduce((sum, unitId) => {
    const target = findUnit(state, unitId);
    return sum + (target ? Math.max(0, getLockPower(target) - getLockPower(actor)) : 0);
  }, 0);
}

function tickStatusesAndCooldowns(state: BattleState, actor: BattleUnitState): void {
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1);
    if (actor.cooldowns[key] === 0) delete actor.cooldowns[key];
  }
  for (const unit of state.units) {
    unit.statuses = unit.statuses
      .map(status => ({ ...status, durationTicks: status.durationTicks - 1 }))
      .filter(status => status.durationTicks > 0);
  }
}

function consumeActionGauge(state: BattleState, actor: BattleUnitState, cost: number): void {
  actor.actionGauge = clamp(actor.actionGauge - Math.max(0, cost), 0, actor.actionGaugeMax);
  clearReadyState(state, actor.snapshot.unitId);
}

function clearReadyState(state: BattleState, unitId: string): void {
  state.readyQueue = state.readyQueue.filter(entry => entry.unitId !== unitId);
}

function enqueueIfReady(state: BattleState, unit: BattleUnitState): void {
  if (unit.actionGauge < unit.actionGaugeMax || isUnitReady(state, unit.snapshot.unitId)) return;
  state.readyQueue.push({
    unitId: unit.snapshot.unitId,
    overflow: 0,
    speed: unit.snapshot.speed,
    awareness: unit.snapshot.awareness,
    tick: state.tick,
  });
  sortReadyQueue(state.readyQueue);
}

function isUnitReady(state: BattleState, unitId: string): boolean {
  return state.readyQueue.some(entry => entry.unitId === unitId);
}

function sortReadyQueue(queue: ReadyQueueEntry[]): void {
  queue.sort((left, right) => {
    const overflow = right.overflow - left.overflow;
    if (overflow !== 0) return overflow;
    const speed = right.speed - left.speed;
    if (speed !== 0) return speed;
    const awareness = right.awareness - left.awareness;
    if (awareness !== 0) return awareness;
    const tick = left.tick - right.tick;
    if (tick !== 0) return tick;
    return left.unitId.localeCompare(right.unitId);
  });
}

function canGainGauge(unit: BattleUnitState): boolean {
  return unit.alive && !unit.escaped && unit.canAct && !hasStatusTag(unit, 'gauge_lock');
}

function getGaugeMultiplier(unit: BattleUnitState): number {
  return unit.statuses.reduce((multiplier, status) => {
    if (status.tags?.includes('haste')) return multiplier + status.potency;
    if (status.tags?.includes('slow')) return Math.max(0.1, multiplier - status.potency);
    return multiplier;
  }, 1);
}

function hasStatusTag(unit: BattleUnitState, tag: string): boolean {
  return unit.statuses.some(status => status.tags?.includes(tag));
}

function getShieldValue(unit: BattleUnitState): number {
  return unit.statuses.filter(status => status.kind === 'shield').reduce((sum, status) => sum + status.potency * status.stacks, 0);
}

function reduceShield(unit: BattleUnitState, amount: number): void {
  let remaining = amount;
  for (const status of unit.statuses) {
    if (status.kind !== 'shield' || remaining <= 0) continue;
    const value = status.potency * status.stacks;
    const absorbed = Math.min(value, remaining);
    remaining -= absorbed;
    status.potency = Math.max(0, status.potency - absorbed / Math.max(1, status.stacks));
  }
  unit.statuses = unit.statuses.filter(status => status.kind !== 'shield' || status.potency > 0);
}

function toUnitBattleResult(unit: BattleUnitState): UnitBattleResult {
  const healthRatio = unit.currentHealth / Math.max(1, unit.snapshot.maxHealth);
  const lifeStateChangeId = unit.escaped
    ? 'escaped'
    : unit.alive
      ? healthRatio < 0.25
        ? 'severe_injury'
        : healthRatio < 0.6
          ? 'minor_injury'
          : 'alive'
      : 'unconscious';
  return {
    unitId: unit.snapshot.unitId,
    lifeStateChangeId,
    healthDelta: unit.currentHealth - unit.snapshot.maxHealth,
    innerPowerDelta: unit.currentInnerPower - unit.snapshot.maxInnerPower,
    appliedStatusIds: unit.statuses.map(status => status.statusId),
    removedStatusIds: [],
  };
}

function buildBattleResultSummary(state: BattleState, outcome: BattleResult['outcome']): string {
  const downUnits = state.units.filter(unit => !unit.alive).map(unit => unit.snapshot.displayName);
  const escapedUnits = state.units.filter(unit => unit.escaped).map(unit => unit.snapshot.displayName);
  return [
    `战斗结束：${outcome}`,
    downUnits.length > 0 ? `倒下：${downUnits.join('、')}` : '',
    escapedUnits.length > 0 ? `脱离：${escapedUnits.join('、')}` : '',
  ]
    .filter(Boolean)
    .join('；');
}

function addBattleEvent(
  state: BattleState,
  type: string,
  actorUnitId: string | undefined,
  targetUnitIds: string[] = [],
  summary: string,
  payload?: Record<string, unknown>,
): BattleEventRecord {
  const record: BattleEventRecord = {
    eventId: createId('battle_event'),
    tick: state.tick,
    type,
    actorUnitId,
    targetUnitIds,
    summary,
    payload,
  };
  state.eventLog.push(record);
  return record;
}

function failValidation(reasonId: string, message: string): CommandValidationResult {
  return { ok: false, reasonId, message };
}

function requireUnit(state: BattleState, unitId: string): BattleUnitState {
  const unit = findUnit(state, unitId);
  if (!unit) throw new Error(`战斗单位不存在：${unitId}`);
  return unit;
}

function assertUniqueUnitIds(state: BattleState): void {
  const seen = new Set<string>();
  for (const unit of state.units) {
    if (!unit.snapshot.unitId) throw new Error('战斗单位缺少 unitId');
    if (seen.has(unit.snapshot.unitId)) throw new Error(`战斗单位重复：${unit.snapshot.unitId}`);
    seen.add(unit.snapshot.unitId);
  }
}

function isSameCamp(left: CombatSide, right: CombatSide): boolean {
  if (left === 'neutral' || right === 'neutral') return left === right;
  return (left === 'player' || left === 'ally') === (right === 'player' || right === 'ally');
}

function isHostile(left: CombatSide, right: CombatSide): boolean {
  if (left === 'neutral' || right === 'neutral') return false;
  return !isSameCamp(left, right);
}

function normalizeGaugeMax(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_GAUGE_MAX;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
