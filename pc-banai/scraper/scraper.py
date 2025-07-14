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
    """
    Visits a product page and intelligently scrapes its power consumption.
    It prioritizes specific labels like "Default TDP".
    """
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        search_labels = ["default tdp", "power consumption", "consumption"]

        for row in soup.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) >= 2:
                label_text = cells[0].get_text(strip=True).lower()
                value_text = cells[1].get_text(strip=True)

                for label in search_labels:
                    if label in label_text:
                        match = re.search(r'(\d+)', value_text)
                        if match:
                            wattage = int(match.group(1))
                            if 10 < wattage < 1500:
                                print(f"    ⚡️ Found '{label}': {wattage}W")
                                return wattage
        
        page_text = soup.get_text().lower()
        match = re.search(r'(\d+)\s*w', page_text)
        if match:
            wattage = int(match.group(1))
            if 10 < wattage < 1500:
                print(f"    ⚡️ Found generic wattage: {wattage}W")
                return wattage

    except Exception as e:
        print(f"    [⚠️ Could not fetch power for {product_url}] {e}")
    
    return 0

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
                item['power_consumption'] = get_power_consumption(item['product_url'])
                data.append(item)
                time.sleep(0.5) 

        page += 1
        time.sleep(1.5)

    return data

def create_or_update_table(engine, table_name):
    with engine.connect() as conn:
        if not inspect(engine).has_table(table_name):
            create_query = f"""
            CREATE TABLE {table_name} (
                id SERIAL PRIMARY KEY,
                product_name TEXT NOT NULL,
                price_bdt INTEGER DEFAULT 0,
                product_url TEXT UNIQUE,
                image_url TEXT,
                availability TEXT,
                brand TEXT,
                short_specs TEXT,
                power_consumption INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """
            conn.execute(text(create_query))
            print(f"✅ Table '{table_name}' created.")
        else:
            result = conn.execute(text(f"SELECT 1 FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='power_consumption'")).scalar_one_or_none()
            if not result:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN power_consumption INTEGER DEFAULT 0;"))
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

    with engine.connect() as conn:
        conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY;"))
        print(f"Cleared table '{table_name}' for fresh data.")
        # ** THE FIX IS HERE: Added chunksize to break the insert into batches **
        df.to_sql(table_name, engine, if_exists='append', index=False, chunksize=50)
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
