import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function fixMissingWallets() {
  try {
    // Get all users with agents
    const usersWithAgents = await db
      .selectDistinct({ userId: schema.agentConfigs.userId })
      .from(schema.agentConfigs);

    console.log(`Found ${usersWithAgents.length} users with agents`);

    for (const { userId } of usersWithAgents) {
      // Check if wallet exists
      const wallet = await db
        .select()
        .from(schema.walletBalance)
        .where(eq(schema.walletBalance.userId, userId));

      if (wallet.length === 0) {
        console.log(`Creating wallet for user ${userId}...`);
        await db.insert(schema.walletBalance).values({
          userId,
          totalBalance: "30",
          availableBalance: "30",
          lockedBalance: "0",
        });
        console.log(`✓ Created wallet for user ${userId}`);
      }
    }

    console.log("All wallets fixed!");
  } catch (error) {
    console.error("Error fixing wallets:", error);
    process.exit(1);
  }
}

fixMissingWallets();
