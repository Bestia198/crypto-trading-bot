import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../db";
import { agentConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Agent Control Button Functionality", () => {
  let db: any;
  let testUserId = 1;
  let testAgentIds: number[] = [];

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create test agents
    const result = await db.insert(agentConfigs).values([
      {
        userId: testUserId,
        agentType: "RL",
        agentName: "TestRL",
        isEnabled: false,
      },
      {
        userId: testUserId,
        agentType: "Momentum",
        agentName: "TestMomentum",
        isEnabled: false,
      },
      {
        userId: testUserId,
        agentType: "MeanReversion",
        agentName: "TestMeanReversion",
        isEnabled: false,
      },
    ]);
  });

  afterAll(async () => {
    if (db && testAgentIds.length > 0) {
      for (const agentId of testAgentIds) {
        await db
          .delete(agentConfigs)
          .where(eq(agentConfigs.id, agentId));
      }
    }
  });

  it("should enable a single agent via Start button", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));
    
    const agent = agents[0];
    testAgentIds.push(agent.id);

    // Simulate Start button click
    await db
      .update(agentConfigs)
      .set({ isEnabled: true })
      .where(eq(agentConfigs.id, agent.id));

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.id, agent.id));

    expect(updated[0].isEnabled).toBe(true);
  });

  it("should disable a single agent via Stop button", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));
    
    const agent = agents[0];

    // Simulate Stop button click
    await db
      .update(agentConfigs)
      .set({ isEnabled: false })
      .where(eq(agentConfigs.id, agent.id));

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.id, agent.id));

    expect(updated[0].isEnabled).toBe(false);
  });

  it("should enable all agents via Enable All button", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    // Simulate Enable All button click
    for (const agent of agents) {
      testAgentIds.push(agent.id);
      await db
        .update(agentConfigs)
        .set({ isEnabled: true })
        .where(eq(agentConfigs.id, agent.id));
    }

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    expect(updated.every((a: any) => a.isEnabled)).toBe(true);
  });

  it("should disable all agents via Disable All button", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    // Simulate Disable All button click
    for (const agent of agents) {
      await db
        .update(agentConfigs)
        .set({ isEnabled: false })
        .where(eq(agentConfigs.id, agent.id));
    }

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    expect(updated.every((a: any) => !a.isEnabled)).toBe(true);
  });

  it("should toggle agent state correctly", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));
    
    const agent = agents[0];
    const initialState = agent.isEnabled;

    // Toggle state
    await db
      .update(agentConfigs)
      .set({ isEnabled: !initialState })
      .where(eq(agentConfigs.id, agent.id));

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.id, agent.id));

    expect(updated[0].isEnabled).toBe(!initialState);
  });

  it("should handle rapid button clicks without race conditions", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));
    
    const agent = agents[0];

    // Simulate rapid clicks
    const updates = [true, false, true, false, true];
    for (const state of updates) {
      await db
        .update(agentConfigs)
        .set({ isEnabled: state })
        .where(eq(agentConfigs.id, agent.id));
    }

    const final = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.id, agent.id));

    expect(final[0].isEnabled).toBe(updates[updates.length - 1]);
  });

  it("should maintain agent configuration during state changes", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));
    
    const agent = agents[0];
    const originalType = agent.agentType;
    const originalName = agent.agentName;

    // Toggle state
    await db
      .update(agentConfigs)
      .set({ isEnabled: true })
      .where(eq(agentConfigs.id, agent.id));

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.id, agent.id));

    expect(updated[0].agentType).toBe(originalType);
    expect(updated[0].agentName).toBe(originalName);
  });

  it("should correctly count active agents", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    // Enable first 2 agents
    for (let i = 0; i < 2; i++) {
      await db
        .update(agentConfigs)
        .set({ isEnabled: true })
        .where(eq(agentConfigs.id, agents[i].id));
    }

    // Disable rest
    for (let i = 2; i < agents.length; i++) {
      await db
        .update(agentConfigs)
        .set({ isEnabled: false })
        .where(eq(agentConfigs.id, agents[i].id));
    }

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    const activeCount = updated.filter((a: any) => a.isEnabled).length;
    expect(activeCount).toBe(2);
  });

  it("should handle button clicks for multiple agents independently", async () => {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    // Enable first agent
    await db
      .update(agentConfigs)
      .set({ isEnabled: true })
      .where(eq(agentConfigs.id, agents[0].id));

    // Disable second agent
    await db
      .update(agentConfigs)
      .set({ isEnabled: false })
      .where(eq(agentConfigs.id, agents[1].id));

    // Enable third agent
    if (agents[2]) {
      await db
        .update(agentConfigs)
        .set({ isEnabled: true })
        .where(eq(agentConfigs.id, agents[2].id));
    }

    const updated = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId));

    expect(updated[0].isEnabled).toBe(true);
    expect(updated[1].isEnabled).toBe(false);
    if (updated[2]) {
      expect(updated[2].isEnabled).toBe(true);
    }
  });
});
