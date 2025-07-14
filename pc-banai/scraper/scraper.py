# pc-banai/scraper/scraper.py

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re
from sqlalchemy import create_engine, text, inspect

# Set your Supabase PostgreSQL connection URI here
SUPABASE_DB_URL = "postgresql://postgres.gsjfvxlyjjprisfskhfz:Higalaxy3!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

# Category mapping
CATEGORIES = {
    "processor": "https://www.startech.com.bd/component/processor",
    "cpu_cooler": "https://www.startech.com.bd/component/CPU-Cooler",
    "motherboard": "https://www.startech.com.bd/component/motherboard",
    "graphics_card": "https://www.startech.com.bd/component/graphics-card",
    "ram": "https://www.startech.com.bd/component/ram",
    "power_supply": "https://www.startech.com.bd/component/power-supply",
    "hard_disk_drive": "https://www.startech.com.bd/component/hard-disk-drive",
    "ssd": "https://www.startech.com.bd/ssd",
    "casing": "https://www.startech.com.bd/component/casing",
    "casing_cooler": "https://www.startech.com.bd/component/casing-cooler"
}

def get_power_consumption(product_url):
    """Visits a product page and tries to find its power consumption."""
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Search for the spec table or any text on the page
        page_text = soup.get_text().lower()
        
        # Regex to find wattage (e.g., "125w", "125 w", "TDP: 65W")
        # It looks for a number followed by "w", ignoring case.
        match = re.search(r'(\d+)\s*w', page_text)
        
        if match:
            wattage = int(match.group(1))
            # Basic sanity check for realistic values
            if 10 < wattage < 1500:
                print(f"    ⚡️ Found power consumption: {wattage}W")
                return wattage
    except Exception as e:
        print(f"    [⚠️ Could not fetch power for {product_url}] {e}")
    return 0 # Return 0 if not found or error

def parse_product(card):
    try:
        name_tag = card.select_one('h4.p-item-name a')
        product_name = name_tag.text.strip()
        product_url = name_tag['href']

        img_tag = card.select_one('div.p-item-img img')
        image_url = img_tag.get('data-src') or img_tag.get('src', 'N/A') if img_tag else 'N/A'

        price_tag = card.select_one('div.p-item-price span')
        price = price_tag.text.strip().replace(',', '').replace('৳', '').strip() if price_tag else '0'

        stock_tag = card.select_one('div.p-item-stock span')
        availability = stock_tag.text.strip() if stock_tag else 'N/A'

        brand_tag = card.select_one('div.p-item-brand img')
        brand = brand_tag['alt'] if brand_tag and brand_tag.has_attr('alt') else 'N/A'

        specs_list = card.select('div.p-item-details ul li')
        short_specs = ' | '.join([li.text.strip() for li in specs_list]) if specs_list else 'N/A'

        return {
            'product_name': product_name,
            'price_bdt': int(price) if price.isdigit() else 0,
            'product_url': product_url,
            'image_url': image_url,
            'availability': availability,
            'brand': brand,
            'short_specs': short_specs,
        }
    except Exception as e:
        print(f"[⚠️ parse_product error] {e}")
        return None

def scrape_category(category, base_url):
    data = []
    page = 1
    while True:
        print(f"Scraping {category} - page {page}...")
        url = f"{base_url}?page={page}"
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, 'html.parser')
        product_cards = soup.select('div.p-item')

        if not product_cards:
            print(f"✅ Finished scraping {category}.\n")
            break

        for card in product_cards:
            item = parse_product(card)
            if item:
                # ** NEW STEP: Get power consumption from the product's page **
                item['power_consumption'] = get_power_consumption(item['product_url'])
                data.append(item)
                time.sleep(0.5) # Be respectful to the server, wait between individual page requests

        page += 1
        time.sleep(1.5) # Wait between list pages

    return data

def create_or_update_table(engine, table_name):
    """Ensures the table exists and has the power_consumption column."""
    with engine.connect() as conn:
        # Check if table exists
        if not inspect(engine).has_table(table_name):
            create_query = f"""
            CREATE TABLE {table_name} (
                id SERIAL PRIMARY KEY,
                product_name TEXT NOT NULL,
                price_bdt INTEGER,
                product_url TEXT UNIQUE,
                image_url TEXT,
                availability TEXT,
                brand TEXT,
                short_specs TEXT,
                power_consumption INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            conn.execute(text(create_query))
            print(f"✅ Table '{table_name}' created in Supabase.")
        else:
            # Check if column exists
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='{table_name}' AND column_name='power_consumption'
            """)).scalar_one_or_none()
            
            if not result:
                alter_query = f"ALTER TABLE {table_name} ADD COLUMN power_consumption INTEGER DEFAULT 0;"
                conn.execute(text(alter_query))
                print(f"✅ Column 'power_consumption' added to table '{table_name}'.")
            else:
                print(f"✅ Table '{table_name}' is ready.")


def insert_into_supabase(category, data):
    if not data:
        print(f"No data to insert for {category}.")
        return
        
    engine = create_engine(SUPABASE_DB_URL)
    table_name = category_to_table_name(category)
    create_or_update_table(engine, table_name)

    df = pd.DataFrame(data)
    df.drop_duplicates(subset=['product_url'], inplace=True)

    # This is a simple way to handle updates. For large scale, a more robust UPSERT is better.
    # For now, we clear the table and re-insert to ensure data is fresh.
    with engine.connect() as conn:
        conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY;"))
        print(f"Cleared table '{table_name}' for fresh data.")
        df.to_sql(table_name, engine, if_exists='append', index=False)
        print(f"✅ Uploaded {len(df)} items to '{table_name}' table.")

def category_to_table_name(category):
    return {
        "processor": "processors",
        "cpu_cooler": "cpu_coolers",
        "motherboard": "motherboards",
        "graphics_card": "graphics_cards",
        "ram": "rams",
        "power_supply": "power_supplies",
        "hard_disk_drive": "hdds",
        "ssd": "ssd_drives",
        "casing": "casings",
        "casing_cooler": "casing_coolers"
    }.get(category, None)

if __name__ == '__main__':
    for category, url in CATEGORIES.items():
        table_name = category_to_table_name(category)
        if not table_name:
            continue
        
        scraped_data = scrape_category(category, url)
        if scraped_data:
            insert_into_supabase(category, scraped_data)
