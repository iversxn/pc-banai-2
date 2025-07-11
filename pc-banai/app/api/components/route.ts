import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

// Create a new pool instance using the connection string from .env.local
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    let query = `
      SELECT 
        c.*, 
        (
          SELECT json_agg(p)
          FROM (
            SELECT 
              pr.price, 
              pr.in_stock, 
              pr.url, 
              pr.last_updated,
              v.name as "vendorName",
              v.id as "vendorId"
            FROM prices pr
            JOIN vendors v ON pr.vendor_id = v.id
            WHERE pr.component_id = c.id
          ) p
        ) as prices
      FROM components c
    `;
    
    const queryParams = [];

    if (category) {
      query += ' WHERE c.category = $1';
      queryParams.push(category);
    }

    const { rows } = await pool.query(query, queryParams);

    // The 'prices' field from the DB is a JSON string, so we parse it.
    const components = rows.map(row => ({
      ...row,
      prices: row.prices ? row.prices : [], // Ensure prices is an array
    }));

    return NextResponse.json(components);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Failed to fetch components' }, { status: 500 });
  }
}
