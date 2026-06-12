import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { CombatParticipantInput, CombatResolvePayload } from '../types/actions';
import type { BattleAutoAdvanceOptions, BattleCommand, BattleSetup, BattleState } from '../types/combat';
import type { BattleReportSummary, GameSave } from '../types/schema';
import { autoAdvanceBattle, createBattleState, resolveBattleCommand, tickBattleState } from './combatAtb';
import { advanceWorldTime } from './time';

export function startBattle(save: GameSave, payload: CombatResolvePayload): string {
  const battleId = payload.battleId ?? createId('battle');
  save.combat.activeBattle = {
    battleId,
    startedAt: nowIso(),
    setupSnapshot: {
      mode: payload.mode,
      locationId: payload.locationId ?? save.player.location.currentLocationId,
      situation: payload.situation ?? '',
      participants: payload.participants,
    },
    stateSnapshot: {},
  };
  pushSaveLog(save, 'COMBAT_START', `战斗开始：${battleId}`, true, [battleId]);
  return `战斗已开始：${battleId}`;
}

export function startAtbBattle(save: GameSave, setup: BattleSetup): string {
  const state = createBattleState(setup);
  save.combat.activeBattle = {
    battleId: state.battleId,
    startedAt: nowIso(),
    setupSnapshot: setup,
    stateSnapshot: state,
  };
  pushSaveLog(save, 'ATB_BATTLE_START', `ATB战斗开始：${state.battleId}`, true, [state.battleId]);
  return `ATB战斗已开始：${state.battleId}`;
}

export function tickActiveAtbBattle(save: GameSave, deltaTime = 50): string {
  const state = loadActiveAtbState(save);
  const result = tickBattleState(state, deltaTime);
  storeActiveAtbState(save, state);
  pushSaveLog(save, 'ATB_BATTLE_TICK', `ATB推进：tick ${result.tick}，待行动 ${result.readiedUnitIds.join('、') || '无'}`);
  return `ATB推进完成：tick ${result.tick}`;
}

export function resolveActiveAtbCommand(save: GameSave, command: BattleCommand): string {
  const state = loadActiveAtbState(save);
  const resolution = resolveBattleCommand(state, command);
  storeActiveAtbState(save, state);
  if (!resolution.ok) {
    pushSaveLog(save, 'ATB_BATTLE_COMMAND', resolution.message, false, [command.actorUnitId]);
    return resolution.message;
  }
  if (resolution.result) {
    completeActiveAtbBattle(save, state);
  }
  pushSaveLog(save, 'ATB_BATTLE_COMMAND', resolution.message, true, [command.actorUnitId, ...(command.targetUnitIds ?? [])]);
  return resolution.result?.summary ?? resolution.message;
}

export function autoAdvanceActiveAtbBattle(save: GameSave, options: BattleAutoAdvanceOptions = {}): string {
  const state = loadActiveAtbState(save);
  const maxSteps = options.maxSteps ?? 40;
  autoAdvanceBattle(state, options);
  storeActiveAtbState(save, state);
  if (state.result) {
    completeActiveAtbBattle(save, state);
  }
  pushSaveLog(save, 'ATB_BATTLE_AUTO', `ATB自动推进${maxSteps}步`, true, [state.battleId]);
  return state.result?.summary ?? `ATB自动推进完成：${state.battleId}`;
}

export function resolveBattle(save: GameSave, payload: CombatResolvePayload): BattleReportSummary {
  const battleId = payload.battleId ?? save.combat.activeBattle?.battleId ?? createId('battle');
  const sides = scoreSides(payload.mode, payload.participants);
  const result = sides.self >= sides.enemy ? '己方占优' : '敌方占优';
  const dangerNotes = buildDangerNotes(payload.participants);
  const summary = [
    `${payload.mode}结算：${result}`,
    `己方势：${Math.round(sides.self)}，敌方势：${Math.round(sides.enemy)}`,
    dangerNotes,
  ]
    .filter(Boolean)
    .join('；');

  const report: BattleReportSummary = {
    battleId,
    endedAt: nowIso(),
    result,
    participants: payload.participants.map(participant => participant.id),
    summary,
  };

  save.combat.activeBattle = null;
  save.combat.recentBattleReports.unshift(report);
  save.combat.recentBattleReports = save.combat.recentBattleReports.slice(0, 20);
  advanceWorldTime(save, payload.mode === 'duel' ? 20 : 45, '战斗结算');
  pushSaveLog(save, 'COMBAT_RESOLVE', summary, true, report.participants);
  return report;
}

function scoreSides(mode: CombatResolvePayload['mode'], participants: CombatParticipantInput[]): { self: number; enemy: number } {
  return participants.reduce(
    (score, participant) => {
      const value = scoreParticipant(mode, participant);
      if (participant.side === 'enemy') score.enemy += value;
      if (participant.side === 'self' || participant.side === 'ally') score.self += value;
      return score;
    },
    { self: 0, enemy: 0 },
  );
}

function scoreParticipant(mode: CombatResolvePayload['mode'], participant: CombatParticipantInput): number {
  const martial = Math.max(0, participant.martialTier ?? 10);
  const troopCount = Math.max(1, participant.troopCount ?? 1);
  const troopWeight = mode === 'formation' ? Math.sqrt(troopCount) * 8 : Math.sqrt(troopCount) * 2;
  const innerPower = Math.max(0, participant.innerPower ?? 50) / 10;
  const stamina = Math.max(0, participant.stamina ?? 50) / 10;
  const weapon = Math.max(0, participant.weaponCondition ?? 80) / 20;
  const poisonPenalty = Math.max(0, participant.poisonLevel ?? 0) * 2;
  const injuryPenalty = Math.max(0, participant.injuryLevel ?? 0) * 3;
  const commanderBonus = participant.role === 'commander' && mode === 'formation' ? 10 : 0;
  return Math.max(1, martial + troopWeight + innerPower + stamina + weapon + commanderBonus - poisonPenalty - injuryPenalty);
}

function buildDangerNotes(participants: CombatParticipantInput[]): string {
  const notes: string[] = [];
  if (participants.some(participant => (participant.innerPower ?? 50) <= 5)) notes.push('有人内力将尽');
  if (participants.some(participant => (participant.stamina ?? 50) <= 5)) notes.push('有人体力将竭');
  if (participants.some(participant => (participant.weaponCondition ?? 80) <= 10)) notes.push('兵器有损毁风险');
  if (participants.some(participant => (participant.poisonLevel ?? 0) > 0)) notes.push('毒伤需要另行处理');
  if (participants.some(participant => (participant.injuryLevel ?? 0) >= 4)) notes.push('重伤者不宜继续行路');
  return notes.join('，');
}

function loadActiveAtbState(save: GameSave): BattleState {
  const state = save.combat.activeBattle?.stateSnapshot as BattleState | undefined;
  if (!state || !state.battleId || !Array.isArray(state.units)) {
    throw new Error('当前没有可用的 ATB 战斗');
  }
  return state;
}

function storeActiveAtbState(save: GameSave, state: BattleState): void {
  if (!save.combat.activeBattle) {
    throw new Error('当前没有激活战斗可写入');
  }
  save.combat.activeBattle.stateSnapshot = state;
}

function completeActiveAtbBattle(save: GameSave, state: BattleState): void {
  if (!state.result) return;
  const report: BattleReportSummary = {
    battleId: state.battleId,
    endedAt: nowIso(),
    result: state.result.outcome,
    participants: state.units.map(unit => unit.snapshot.unitId),
    summary: state.result.summary,
  };
  save.combat.activeBattle = null;
  save.combat.recentBattleReports.unshift(report);
  save.combat.recentBattleReports = save.combat.recentBattleReports.slice(0, 20);
  advanceWorldTime(save, 30, 'ATB战斗结束');
}
