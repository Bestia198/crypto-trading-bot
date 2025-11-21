import { drizzle } from "drizzle-orm/mysql2";
import { agentConfigs } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.log("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

try {
  const agents = await db.select().from(agentConfigs);
  console.log("Agent configs found:", agents.length);
  agents.forEach(a => console.log(`- ${a.agentName} (${a.agentType})`));
} catch (error) {
  console.error("Error:", error.message);
}
