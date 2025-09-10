# pc-banai/scraper/scraper.py

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re
from sqlalchemy import create_engine, text, inspect
import os

# Read Supabase PostgreSQL connection URI from environment (GitHub Actions/hosting)
SUPABASE_DB_URL = os.getenv("DATABASE_URL")
if not SUPABASE_DB_URL:
    raise RuntimeError("DATABASE_URL environment variable is required for scraper")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

# Retailer configurations (category URLs and parsing strategies)
RETAILERS = {
    "startech": {
        "name": "StarTech",
        "table_suffix": None,
        "categories": {
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
        },
        "selectors": {
            "card": ["div.p-item"],
            "name": ["h4.p-item-name a"],
            "url_attr": "href",
            "price": ["div.p-item-price span", "span.price-new", "span.price"],
            "stock": ["div.p-item-stock span"],
            "brand": ["div.p-item-brand img@alt"],
            "image": ["div.p-item-img img@data-src", "div.p-item-img img@src"],
            "specs_list": ["div.p-item-details ul li"]
        },
    },
    "techland": {
        "name": "Techland BD",
        "table_suffix": "_techland",
        "categories": {
            "processor": "https://www.techlandbd.com/pc-components/processor",
            "cpu_cooler": "https://www.techlandbd.com/pc-components/cpu-cooler",
            "motherboard": "https://www.techlandbd.com/pc-components/motherboard",
            "graphics_card": "https://www.techlandbd.com/pc-components/graphics-card",
            "ram": "https://https://www.techlandbd.com/pc-components/shop-desktop-ram",
            "power_supply": "https://www.techlandbd.com/pc-components/power-supply",
            "hard_disk_drive": "https://www.techlandbd.com/pc-components/hard-disk-drive",
            "ssd": "https://www.techlandbd.com/pc-components/solid-state-drive",
            "casing": "https://www.techlandbd.com/pc-components/computer-case",
            "casing_cooler": "https://www.techlandbd.com/pc-components/casing-fan",
        },
        "selectors": {
            "card": ["div.product-layout", "div.product-grid", "div.product-thumb"],
            "name": ["div.caption h4 a", "h4 a", "a.product-name"],
            "url_attr": "href",
            "price": ["p.price span.price-new", "p.price", "span.price"],
            "stock": ["div.stock span", "span.stock"],
            "brand": ["div.manufacturer a", "div.caption a[rel='nofollow']"],
            "image": ["div.image img@data-src", "div.image img@src", "img@src"],
            "specs_list": ["div.description ul li", "div.caption ul li"]
        },
    },
    "ultratech": {
        "name": "Ultratech BD",
        "table_suffix": "_ultratech",
        "categories": {
            "processor": "https://www.ultratech.com.bd/pc-components/processor",
            "cpu_cooler": "https://www.ultratech.com.bd/pc-components/cpu-cooler",
            "motherboard": "https://www.ultratech.com.bd/pc-components/motherboard",
            "graphics_card": "https://www.ultratech.com.bd/pc-components/graphics-card",
            "ram": "https://www.ultratech.com.bd/pc-components/ram",
            "power_supply": "https://www.ultratech.com.bd/pc-components/power-supply",
            "hard_disk_drive": "https://www.ultratech.com.bd/pc-components/hdd",
            "ssd": "https://www.ultratech.com.bd/pc-components/ssd",
            "casing": "https://www.ultratech.com.bd/pc-components/casing",
            "casing_cooler": "https://www.ultratech.com.bd/case-fan",
        },
        "selectors": {
            "card": ["div.product-item", "div.product-grid"],
            "name": ["h4 a", "a.product-name"],
            "url_attr": "href",
            "price": ["span.price-new", "span.price", "div.price"],
            "stock": ["span.stock", "div.stock"],
            "brand": ["div.manufacturer a", "div.brand a"],
            "image": ["img@data-src", "img@src"],
            "specs_list": ["ul.specs li", "div.description ul li"]
        },
    },
    "skyland": {
        "name": "Skyland BD",
        "table_suffix": "_skyland",
        "categories": {
            "processor": "https://www.skyland.com.bd/components/processor",
            "cpu_cooler": "https://www.skyland.com.bd/components/cpu-cooler",
            "motherboard": "https://www.skyland.com.bd/components/motherboard",
            "graphics_card": "https://www.skyland.com.bd/components/graphics-card",
            "ram": "https://www.skyland.com.bd/components/ram",
            "power_supply": "https://www.skyland.com.bd/components/power-supply",
            "hard_disk_drive": "https://www.skyland.com.bd/components/hard-disk",
            "ssd": "https://www.skyland.com.bd/components/ssd",
            "casing": "https://www.skyland.com.bd/components/casing",
            "casing_cooler": "https://www.skyland.com.bd/components/casing-fan",
        },
        "selectors": {
            "card": ["div.product-layout", "div.product"],
            "name": ["h4 a", "a.product-name"],
            "url_attr": "href",
            "price": ["span.price-new", "span.price", "div.price"],
            "stock": ["span.stock", "div.stock"],
            "brand": ["div.manufacturer a", "div.brand a"],
            "image": ["img@data-src", "img@src"],
            "specs_list": ["ul.specs li", "div.description ul li"]
        },
    },
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

def _first_non_empty(text_list):
    for t in text_list:
        if t and str(t).strip():
            return str(t).strip()
    return None


def _select_attr(soup, selector_defs):
    for sel in selector_defs:
        if "@" in sel:
            css, attr = sel.split("@", 1)
            el = soup.select_one(css)
            if el and el.has_attr(attr):
                v = el.get(attr)
                if v:
                    return str(v).strip()
        else:
            el = soup.select_one(sel)
            if el:
                txt = el.get_text(strip=True)
                if txt:
                    return txt
    return None


def parse_product(card, selectors):
    try:
        name_el = None
        for s in selectors.get("name", []):
            name_el = card.select_one(s)
            if name_el:
                break
        if not name_el:
            return None
        product_name = name_el.get_text(strip=True)
        product_url = name_el.get(selectors.get("url_attr", "href")) or ""

        image_url = _select_attr(card, selectors.get("image", [])) or ""

        price_txt = _select_attr(card, selectors.get("price", [])) or "0"
        price = re.sub(r"[^0-9]", "", price_txt)

        availability = _select_attr(card, selectors.get("stock", [])) or "N/A"

        brand = _select_attr(card, selectors.get("brand", [])) or "N/A"

        specs_nodes = []
        for s in selectors.get("specs_list", []):
            specs_nodes = card.select(s)
            if specs_nodes:
                break
        short_specs = ' | '.join([li.get_text(strip=True) for li in specs_nodes]) if specs_nodes else 'N/A'

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

def scrape_category(category, base_url, selectors):
    data = []
    page = 1
    while True:
        print(f"Scraping {category} - page {page}...")
        url = f"{base_url}?page={page}"
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, 'html.parser')
        cards = []
        for s in selectors.get("card", []):
            found = soup.select(s)
            if found:
                cards = found
                break

        if not cards:
            print(f"✅ Finished scraping {category}.\n")
            break

        for card in cards:
            item = parse_product(card, selectors)
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

def insert_into_supabase(category, data, table_suffix=None):
    if not data:
        print(f"No data to insert for {category}.")
        return
        
    engine = create_engine(SUPABASE_DB_URL)
    table_name = category_to_table_name(category)
    create_or_update_table(engine, table_name)

    df = pd.DataFrame(data)
    df.drop_duplicates(subset=['product_url'], inplace=True)

    # --- NEW: Row-by-row insertion to prevent timeouts ---
    with engine.connect() as conn:
        with conn.begin(): # Start a transaction
            conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY;"))
            print(f"Cleared table '{table_name}' for fresh data.")
            
            # Iterate over the DataFrame and insert each row individually
            for index, row in df.iterrows():
                row_dict = row.to_dict()
                columns = ", ".join(row_dict.keys())
                placeholders = ", ".join([f":{col}" for col in row_dict.keys()])
                
                insert_stmt = text(f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})")
                conn.execute(insert_stmt, row_dict)

    print(f"✅ Successfully uploaded {len(df)} items to '{table_name}' table.")


def category_to_table_name(category, suffix: str | None = None):
    base = {
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
    if not base:
        return None
    return f"{base}{suffix}" if suffix else base

if __name__ == '__main__':
    for retailer_key, cfg in RETAILERS.items():
        print(f"\n==== Scraping retailer: {cfg['name']} ====")
        suffix = cfg.get("table_suffix")
        for category, url in cfg["categories"].items():
            table_name = category_to_table_name(category, suffix)
            if not table_name:
                continue
            try:
                scraped_data = scrape_category(category, url, cfg["selectors"])
                if scraped_data:
                    # override to correct table with suffix in create_or_update_table
                    def create_or_update_table_override(engine, _):
                        return create_or_update_table(engine, table_name)
                    # Insert
                    engine = create_engine(SUPABASE_DB_URL)
                    create_or_update_table(engine, table_name)
                    df = pd.DataFrame(scraped_data)
                    df.drop_duplicates(subset=['product_url'], inplace=True)
                    with engine.connect() as conn:
                        with conn.begin():
                            conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY;"))
                            print(f"Cleared table '{table_name}' for fresh data.")
                            for _, row in df.iterrows():
                                row_dict = row.to_dict()
                                columns = ", ".join(row_dict.keys())
                                placeholders = ", ".join([f":{col}" for col in row_dict.keys()])
                                insert_stmt = text(f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})")
                                conn.execute(insert_stmt, row_dict)
                    print(f"✅ Successfully uploaded {len(df)} items to '{table_name}' table.")
            except Exception as e:
                print(f"[⚠️ {cfg['name']} {category}] {e}")
