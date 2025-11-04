import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  agentConfigs,
  automationSchedules,
  agentStatus,
} from "../drizzle/schema";

export async function getAgentConfigsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.userId, userId));
}

export async function createAgentConfig(config: {
  userId: number;
  agentType: string;
  agentName: string;
  learningRate?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(agentConfigs).values({
    userId: config.userId,
    agentType: config.agentType,
    agentName: config.agentName,
    learningRate: config.learningRate?.toString(),
    stopLossPct: config.stopLossPct?.toString(),
    takeProfitPct: config.takeProfitPct?.toString(),
  });
}

export async function getAutomationSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(automationSchedules)
    .where(eq(automationSchedules.userId, userId));
}

export async function createAutomationSchedule(schedule: {
  userId: number;
  scheduleName: string;
  cronExpression: string;
  symbol: string;
  initialCapital: number;
  agentIds: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(automationSchedules).values({
    userId: schedule.userId,
    scheduleName: schedule.scheduleName,
    cronExpression: schedule.cronExpression,
    symbol: schedule.symbol,
    initialCapital: schedule.initialCapital.toString(),
    agentIds: JSON.stringify(schedule.agentIds),
  });
}

export async function toggleAutomationSchedule(
  scheduleId: number,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(automationSchedules)
    .set({ isActive })
    .where(eq(automationSchedules.id, scheduleId));
}

export async function deleteAutomationSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(agentStatus)
    .where(eq(agentStatus.scheduleId, scheduleId));
  return await db
    .delete(automationSchedules)
    .where(eq(automationSchedules.id, scheduleId));
}

export async function getAgentStatusByScheduleId(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(agentStatus)
    .where(eq(agentStatus.scheduleId, scheduleId));
}

export async function updateAgentStatus(
  statusId: number,
  updates: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(agentStatus)
    .set(updates)
    .where(eq(agentStatus.id, statusId));
}
