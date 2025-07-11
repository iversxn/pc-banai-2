import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from sqlalchemy import create_engine, text

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

def parse_product(card, category):
    try:
        name_tag = card.select_one('h4.p-item-name a')
        product_name = name_tag.text.strip()
        product_url = name_tag['href']

        # Image
        img_tag = card.select_one('div.p-item-img img')
        image_url = img_tag.get('data-src') or img_tag.get('src', 'N/A') if img_tag else 'N/A'

        # Price
        price_tag = card.select_one('div.p-item-price span')
        price = price_tag.text.strip().replace(',', '').replace('৳', '').strip() if price_tag else 'N/A'

        # Availability
        stock_tag = card.select_one('div.p-item-stock span')
        availability = stock_tag.text.strip() if stock_tag else 'N/A'

        # Brand
        brand_tag = card.select_one('div.p-item-brand img')
        brand = brand_tag['alt'] if brand_tag and brand_tag.has_attr('alt') else 'N/A'

        # Specs
        specs_list = card.select('div.p-item-details ul li')
        short_specs = ' | '.join([li.text.strip() for li in specs_list]) if specs_list else 'N/A'

        return {
            'category': category,
            'product_name': product_name,
            'price_bdt': price,
            'product_url': product_url,
            'image_url': image_url,
            'availability': availability,
            'brand': brand,
            'short_specs': short_specs
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
            item = parse_product(card, category)
            if item:
                data.append(item)

        page += 1
        time.sleep(1.5)

    return data

def create_table_if_not_exists(engine):
    create_query = """
    CREATE TABLE IF NOT EXISTS pc_components (
        id SERIAL PRIMARY KEY,
        category TEXT,
        product_name TEXT NOT NULL,
        price_bdt TEXT,
        product_url TEXT UNIQUE,
        image_url TEXT,
        availability TEXT,
        brand TEXT,
        short_specs TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    with engine.connect() as conn:
        conn.execute(text(create_query))
        print("✅ Table 'pc_components' ensured in Supabase.")

def insert_into_supabase(all_data):
    engine = create_engine(SUPABASE_DB_URL)
    create_table_if_not_exists(engine)

    df = pd.DataFrame(all_data)
    df.drop_duplicates(subset=['product_url'], inplace=True)

    df.to_sql('pc_components', engine, if_exists='append', index=False)
    print(f"✅ Uploaded {len(df)} new items to Supabase.")

if __name__ == '__main__':
    all_data = []

    for category, url in CATEGORIES.items():
        category_data = scrape_category(category, url)
        all_data.extend(category_data)

    insert_into_supabase(all_data)
