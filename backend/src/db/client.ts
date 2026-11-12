import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>["db"];

export const createDatabase = (url: string) => {
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    waitForConnections: true,
    timezone: "Z",
  });

  return { db: drizzle(pool, { schema, mode: "default" }), pool };
};
