import { getDb } from "./db";
import { fraudReports, InsertFraudReport } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function insertFraudReport(
  data: Omit<InsertFraudReport, "id" | "status" | "createdAt">,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(fraudReports).values(data);
}

export async function listFraudReports(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fraudReports)
    .orderBy(desc(fraudReports.createdAt))
    .limit(limit);
}
