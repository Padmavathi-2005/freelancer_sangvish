import pool from '../config/db.js';

// POST /api/analytics/search
export const logSearch = async (req, res) => {
  try {
    const { query_text, search_type, results_count, device_type } = req.body;
    
    if (!query_text || !search_type) {
      return res.status(400).json({ message: "query_text and search_type are required." });
    }

    // Try to get user_id from auth if present, otherwise null
    const userId = req.user?.user_id || null;

    const result = await pool.query(
      `INSERT INTO search_logs (user_id, query_text, search_type, results_count, device_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, query_text.trim(), search_type, results_count || 0, device_type || 'Desktop']
    );

    res.status(201).json({ message: "Search logged successfully", log: result.rows[0] });
  } catch (error) {
    console.error("Error logging search:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/search-summary
export const getSearchLogsSummary = async (req, res) => {
  try {
    // 1. Top Search Queries (Overall)
    const topQueriesRes = await pool.query(`
      SELECT query_text, search_type, COUNT(*) as search_count, MAX(created_at) as last_searched
      FROM search_logs
      GROUP BY query_text, search_type
      ORDER BY search_count DESC
      LIMIT 15
    `);

    // 2. Zero-Result Gaps (Client demand that returned nothing)
    const zeroResultsRes = await pool.query(`
      SELECT query_text, search_type, COUNT(*) as search_count, MAX(created_at) as last_searched
      FROM search_logs
      WHERE results_count = 0
      GROUP BY query_text, search_type
      ORDER BY search_count DESC
      LIMIT 15
    `);

    // 3. Device Distribution
    const devicesRes = await pool.query(`
      SELECT device_type, COUNT(*) as count
      FROM search_logs
      GROUP BY device_type
    `);

    // 4. Supply-Demand Matrix calculation
    // Fetch unique popular queries, then count matching listings
    const popularQueriesRes = await pool.query(`
      SELECT DISTINCT ON (LOWER(query_text)) query_text, COUNT(*) as search_count, search_type
      FROM search_logs
      GROUP BY query_text, search_type
      ORDER BY LOWER(query_text), search_count DESC
      LIMIT 10
    `);

    const supplyDemandMatrix = [];
    for (const row of popularQueriesRes.rows) {
      const q = row.query_text;
      
      let supplyCount = 0;
      if (row.search_type === 'gigs') {
        const gigCheck = await pool.query(
          `SELECT COUNT(*) FROM gigs WHERE (title ILIKE $1 OR description ILIKE $1) AND status = 'Active'`,
          [`%${q}%`]
        );
        supplyCount = parseInt(gigCheck.rows[0].count);
      } else if (row.search_type === 'projects') {
        const jobCheck = await pool.query(
          `SELECT COUNT(*) FROM jobs WHERE (title ILIKE $1 OR description ILIKE $1) AND status = 'Open'`,
          [`%${q}%`]
        );
        supplyCount = parseInt(jobCheck.rows[0].count);
      } else {
        // talent search
        const talentCheck = await pool.query(
          `SELECT COUNT(*) FROM freelancer_profiles fp 
           JOIN users u ON u.user_id = fp.user_id 
           WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR fp.bio ILIKE $1 OR EXISTS (
             SELECT 1 FROM user_skills us 
             JOIN skills s ON s.skill_id = us.skill_id 
             WHERE us.user_id = fp.user_id AND s.skill_name ILIKE $1
           ))`,
          [`%${q}%`]
        );
        supplyCount = parseInt(talentCheck.rows[0].count);
      }

      supplyDemandMatrix.push({
        query: q,
        type: row.search_type,
        searches: parseInt(row.search_count),
        active_supply: supplyCount,
        ratio: supplyCount > 0 ? (parseInt(row.search_count) / supplyCount).toFixed(2) : row.search_count
      });
    }

    res.status(200).json({
      topQueries: topQueriesRes.rows,
      zeroResults: zeroResultsRes.rows,
      devices: devicesRes.rows,
      supplyDemandMatrix: supplyDemandMatrix.sort((a, b) => b.searches - a.searches)
    });
  } catch (error) {
    console.error("Error fetching search analytics summary:", error);
    res.status(500).json({ message: error.message });
  }
};
