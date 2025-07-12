import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

// Use the Vercel-provided non-pooling URL in production, with a fallback to the local one.
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    // The query now explicitly selects and aliases all required columns.
    let query = `
      SELECT 
        c.id,
        c.name,
        c.name_bengali as "nameBengali",
        c.category,
        c.brand,
        c.socket,
        c.chipset,
        c.memory_type as "memoryType",
        c.form_factor as "formFactor",
        c.power_consumption as "powerConsumption",
        c.specifications,
        c.images,
        (
          SELECT json_agg(p_info)
          FROM (
            SELECT 
              pr.price, 
              pr.in_stock as "inStock", 
              pr.url, 
              pr.last_updated as "lastUpdated",
              v.name as "vendorName",
              v.id as "vendorId"
            FROM prices pr
            JOIN vendors v ON pr.vendor_id = v.id
            WHERE pr.component_id = c.id
          ) p_info
        ) as prices
      FROM components c
    `;
    
    const queryParams = [];

    if (category) {
      query += ' WHERE c.category = $1';
      queryParams.push(category);
    }

    const { rows } = await pool.query(query, queryParams);

    const components = rows.map(row => ({
      ...row,
      prices: row.prices || [],
    }));

    return NextResponse.json(components);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ message: 'Failed to fetch components from the database.', error: (error as Error).message }, { status: 500 });
  }
}
