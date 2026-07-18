import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.query('SELECT slug FROM communities');
const dbSlugs = rows.map(r => r.slug);

const realSlugs = new Set(
  readFileSync('/tmp/real_slugs.txt', 'utf8').trim().split('\n')
);

const fakeSlugs = dbSlugs.filter(s => !realSlugs.has(s));

console.log('DB total:', dbSlugs.length);
console.log('Real dataset:', realSlugs.size);
console.log('Fake/extra rows:', fakeSlugs.length);

if (fakeSlugs.length > 0) {
  console.log('Fake slugs:', fakeSlugs);
  // Delete them in batches of 100
  for (let i = 0; i < fakeSlugs.length; i += 100) {
    const batch = fakeSlugs.slice(i, i + 100);
    const placeholders = batch.map(() => '?').join(',');
    await conn.query(`DELETE FROM communities WHERE slug IN (${placeholders})`, batch);
  }
  console.log(`Deleted ${fakeSlugs.length} fake rows.`);
} else {
  console.log('No fake rows found — DB is clean.');
}

const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM communities');
console.log('DB total after cleanup:', total);

await conn.end();
