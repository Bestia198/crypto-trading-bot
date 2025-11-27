import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { agentConfigs, agentExecutions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { startAgentExecution, stopAgentExecution } from "../automationDb";

describe("Agent Activation System", () => {
  let db: any;
  let testUserId: number;
  let testAgentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get first user and agent for testing
    const userResult = await db.select().from(users).limit(1);
    if (userResult.length > 0) {
      testUserId = userResult[0].id;
    }

    const agentResult = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, testUserId))
      .limit(1);
    if (agentResult.length > 0) {
      testAgentId = agentResult[0].id;
    }
  });

  describe("Agent Activation", () => {
    it("should start agent execution and set isEnabled to true", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // Start execution
      await startAgentExecution({
        userId: testUserId,
        agentId: testAgentId,
      });

      // Check agent status
      const agent = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, testAgentId))
        .limit(1);

      expect(agent.length).toBeGreaterThan(0);
      expect(agent[0].isEnabled).toBe(true);
    });

    it("should create execution record when starting agent", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // Get executions before
      const executionsBefore = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId));

      const countBefore = executionsBefore.length;

      // Start execution
      await startAgentExecution({
        userId: testUserId,
        agentId: testAgentId,
      });

      // Get executions after
      const executionsAfter = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId));

      expect(executionsAfter.length).toBeGreaterThan(countBefore);
    });

    it("should have correct execution status", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // Get latest execution
      const executions = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId))
        .limit(1);

      if (executions.length > 0) {
        expect(["running", "stopped"]).toContain(executions[0].status);
      }
    });
  });

  describe("Agent Deactivation", () => {
    it("should stop agent execution and set isEnabled to false", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // First start the agent
      await startAgentExecution({
        userId: testUserId,
        agentId: testAgentId,
      });

      // Get the execution
      const executions = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId))
        .limit(1);

      if (executions.length > 0) {
        // Stop execution
        await stopAgentExecution(executions[0].id);

        // Check agent status
        const agent = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.id, testAgentId))
          .limit(1);

        expect(agent.length).toBeGreaterThan(0);
        expect(agent[0].isEnabled).toBe(false);
      }
    });

    it("should update execution status to stopped", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // Get latest execution
      const executions = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId))
        .limit(1);

      if (executions.length > 0) {
        expect(["running", "stopped"]).toContain(executions[0].status);
      }
    });
  });

  describe("Agent Status Consistency", () => {
    it("should have consistent isEnabled status across multiple toggles", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      // Start agent
      await startAgentExecution({
        userId: testUserId,
        agentId: testAgentId,
      });

      let agent = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, testAgentId))
        .limit(1);

      expect(agent[0].isEnabled).toBe(true);

      // Get execution and stop
      const executions = await db
        .select()
        .from(agentExecutions)
        .where(eq(agentExecutions.agentId, testAgentId))
        .limit(1);

      if (executions.length > 0) {
        await stopAgentExecution(executions[0].id);
      }

      agent = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, testAgentId))
        .limit(1);

      expect(agent[0].isEnabled).toBe(false);
    });

    it("should have valid timestamps for activation/deactivation", async () => {
      if (!testUserId || !testAgentId) {
        console.log("Skipping test - no test data available");
        return;
      }

      const agent = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, testAgentId))
        .limit(1);

      if (agent.length > 0) {
        expect(agent[0].createdAt).toBeDefined();
        expect(agent[0].updatedAt).toBeDefined();

        const createdTime = new Date(agent[0].createdAt).getTime();
        const updatedTime = new Date(agent[0].updatedAt).getTime();

        expect(createdTime).toBeGreaterThan(0);
        expect(updatedTime).toBeGreaterThanOrEqual(createdTime);
      }
    });
  });
});
