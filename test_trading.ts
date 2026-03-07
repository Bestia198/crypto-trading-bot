import { drizzle } from "drizzle-orm/mysql2";
import { tradingResults, agentConfigs, walletBalance } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.log("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function main() {
  try {
    console.log("Checking trading data...\n");
    
    const tradeCount = await db.select().from(tradingResults);
    console.log(`Total trades in database: ${tradeCount.length}`);
    
    const agentCount = await db.select().from(agentConfigs);
    console.log(`Total agents in database: ${agentCount.length}`);
    
    const walletCount = await db.select().from(walletBalance);
    console.log(`Total wallets in database: ${walletCount.length}`);
    
    if (tradeCount.length > 0) {
      console.log("\nSample trades:");
      tradeCount.slice(0, 3).forEach(t => {
        console.log(`- Agent ${t.agentId}: ${t.tradeType} ${t.symbol} @ ${t.entryPrice} -> ${t.exitPrice}, Profit: ${t.profit}`);
      });
    }
    
    if (agentCount.length > 0) {
      console.log("\nSample agents:");
      agentCount.slice(0, 3).forEach(a => {
        console.log(`- ${a.agentName} (${a.agentType}), User: ${a.userId}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
