import { getDb } from "./db";

function main() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT source_name,
              COUNT(*) as total,
              SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as withImage
       FROM articles
       GROUP BY source_name`
    )
    .all();
  console.table(rows);
  process.exit(0);
}

main();