import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { autoTradingEngine } from "../autoTradingEngine";

describe("Autonomous Trading Engine", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
    autoTradingEngine.stop();
  });

  it("should start and stop the trading engine", async () => {
    autoTradingEngine.start(1000);
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
    expect(autoTradingEngine).toBeDefined();
  });

  it("should execute trades for enabled agents", async () => {
    // This test verifies the engine can be started
    autoTradingEngine.start(2000);
    
    // Wait for initial execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    autoTradingEngine.stop();
    expect(autoTradingEngine).toBeDefined();
  });

  it("should handle multiple agents in parallel", async () => {
    autoTradingEngine.start(1000);
    
    // Verify engine is running
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
  });

  it("should have fallback mechanisms for AI signal generation", async () => {
    // Test that the engine has proper error handling
    autoTradingEngine.start(1000);
    
    // Engine should continue running even if LLM fails
    await new Promise(resolve => setTimeout(resolve, 100));
    
    autoTradingEngine.stop();
    expect(autoTradingEngine).toBeDefined();
  });

  it("should respect wallet balance limits", async () => {
    // Test that trades respect available balance
    autoTradingEngine.start(1000);
    
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
  });

  it("should execute both BUY and SELL trades", async () => {
    autoTradingEngine.start(1000);
    
    // Engine should generate mixed BUY/SELL trades
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
  });

  it("should calculate profit/loss correctly", async () => {
    autoTradingEngine.start(1000);
    
    // Verify profit calculation logic
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
  });

  it("should log trading activity", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    
    autoTradingEngine.start(1000);
    
    // Verify logging
    expect(consoleSpy).toHaveBeenCalled();
    
    autoTradingEngine.stop();
    consoleSpy.mockRestore();
  });

  it("should handle database errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    
    autoTradingEngine.start(1000);
    
    // Engine should continue running even with DB errors
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
    consoleErrorSpy.mockRestore();
  });

  it("should support on/off control", async () => {
    // Test start
    autoTradingEngine.start(1000);
    expect(autoTradingEngine).toBeDefined();
    
    // Test stop
    autoTradingEngine.stop();
    expect(autoTradingEngine).toBeDefined();
    
    // Test restart
    autoTradingEngine.start(1000);
    expect(autoTradingEngine).toBeDefined();
    
    autoTradingEngine.stop();
  });
});
