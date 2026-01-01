const { execSync } = require('child_process');

function debugSearch(query) {
    console.log(`\n=== Debugging Query: "${query}" ===`);

    // 1. Simulate Clean Logic
    let cleanQuery = query
        .replace(/你有|你知道|你知道嗎|你能|你能從|google map|google maps|的資訊|資訊|嗎|呢|？|\?/gi, '')
        .trim();

    cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();
    console.log(`Cleaned Query: "${cleanQuery}"`);

    // 2. Simulate Split Logic
    const keywords = cleanQuery.split(/\s+/).filter(k => k.length >= 2);
    console.log(`Keywords:`, keywords);

    if (keywords.length <= 1) {
        console.log("Not enough keywords for smart search.");
        return;
    }

    // 3. Construct SQL
    const conditions = keywords.map(() => 'name LIKE ?').join(' AND ');
    // Note: For d1 execute, we need to inject values directly or use special syntax, 
    // but for this debug script we will construct the raw string to pass to --command
    // SQLite strings need single quotes.

    const sqlConditions = keywords.map(k => `name LIKE '%${k}%'`).join(' AND ');
    const sql = `SELECT id, name FROM locations WHERE ${sqlConditions}`;

    console.log(`Generated SQL: "${sql}"`);

    // 4. Run against Remote DB
    try {
        console.log("Executing against remote DB...");
        const cmd = `npx wrangler d1 execute hopenghucc_db --command "${sql}" --remote`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        console.log("DB Output:\n", output);
    } catch (e) {
        console.error("Execution failed:", e.message);
    }
}

// Run the failing case
debugSearch("黑山頭 Hasento Inn 的資訊");
