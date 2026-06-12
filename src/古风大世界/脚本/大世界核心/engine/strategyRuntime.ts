import { nowIso, pushSaveLog } from '../state/defaults';
import type { GameSave } from '../types/schema';
import type { StrategyCampaignSetup, StrategyCampaignState, StrategyOrder } from '../types/strategy';
import { createStrategyCampaign, enqueueStrategyOrder, mergeResources, resolveStrategyTurn } from './strategy';

export function startStrategyCampaign(save: GameSave, setup: StrategyCampaignSetup): string {
  const campaign = createStrategyCampaign({
    ...setup,
    resources: mergeResources(save.strategy.resources, setup.resources ?? {}),
  });
  save.strategy.campaigns[campaign.campaignId] = campaign;
  save.strategy.activeCampaignId = campaign.campaignId;
  save.strategy.resources = campaign.resources;
  pushSaveLog(save, 'STRATEGY_CAMPAIGN_START', `战略战役开始：${campaign.name}`, true, [campaign.campaignId]);
  return `战略战役已开始：${campaign.name}`;
}

export function enqueueActiveStrategyOrder(save: GameSave, order: StrategyOrder, campaignId?: string): string {
  const campaign = loadStrategyCampaign(save, campaignId);
  enqueueStrategyOrder(campaign, order);
  save.strategy.campaigns[campaign.campaignId] = campaign;
  pushSaveLog(save, 'STRATEGY_ORDER_ENQUEUE', `战略军令已加入：${order.kind}`, true, [
    campaign.campaignId,
    order.forceId ?? '',
    order.targetLocationId ?? '',
  ].filter(Boolean));
  return `战略军令已加入：${order.kind}`;
}

export function resolveActiveStrategyTurn(save: GameSave, campaignId?: string, maxOrders?: number): string {
  const campaign = loadStrategyCampaign(save, campaignId);
  const result = resolveStrategyTurn(campaign, maxOrders);
  save.strategy.campaigns[campaign.campaignId] = campaign;
  save.strategy.resources = result.resources;
  save.strategy.activeCampaignId = campaign.campaignId;
  save.strategy.lastResolvedAt = nowIso();
  pushSaveLog(save, 'STRATEGY_TURN_RESOLVE', result.summary, true, [campaign.campaignId]);
  return result.summary;
}

function loadStrategyCampaign(save: GameSave, campaignId?: string): StrategyCampaignState {
  const activeCampaignId = campaignId ?? save.strategy.activeCampaignId;
  if (!activeCampaignId) throw new Error('当前没有激活战略战役');
  const campaign = save.strategy.campaigns[activeCampaignId] as StrategyCampaignState | undefined;
  if (!campaign || campaign.campaignId !== activeCampaignId) {
    throw new Error(`战略战役不存在：${activeCampaignId}`);
  }
  return campaign;
}
