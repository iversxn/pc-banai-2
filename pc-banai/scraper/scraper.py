import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from sqlalchemy import create_engine, text

# Set your Supabase PostgreSQL connection URI here (replace [YOUR-PASSWORD])
SUPABASE_DB_URL = "postgresql://postgres.gsjfvxlyjjprisfskhfz:Higalaxy3!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

BASE_URL = 'https://www.startech.com.bd/component/processor'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

def get_total_pages():
    response = requests.get(BASE_URL, headers=HEADERS)
    soup = BeautifulSoup(response.content, 'html.parser')
    pages = soup.select('ul.pagination li a.page-link')
    page_numbers = [int(a.text.strip()) for a in pages if a.text.strip().isdigit()]
    return max(page_numbers) if page_numbers else 1

def parse_product(card):
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



def scrape_all_processors():
    all_data = []
    page = 1

    while True:
        print(f"Scraping page {page}...")
        url = f"{BASE_URL}?page={page}"
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, 'html.parser')
        product_cards = soup.select('div.p-item')

        if not product_cards:
            print("🚫 No more products found — ending scrape.")
            break

        for card in product_cards:
            item = parse_product(card)
            if item:
                all_data.append(item)

        page += 1
        time.sleep(1.5)

    print(f"✅ Scraped {len(all_data)} products in total.")
    return all_data


def create_table_if_not_exists(engine):
    create_query = """
    CREATE TABLE IF NOT EXISTS processors (
        id SERIAL PRIMARY KEY,
        product_name TEXT,
        price_bdt TEXT,
        product_url TEXT,
        image_url TEXT,
        availability TEXT,
        brand TEXT,
        short_specs TEXT
    );
    """
    with engine.connect() as conn:
        conn.execute(text(create_query))
        print("✅ Table 'processors' ready in Supabase.")

def insert_into_supabase(data):
    engine = create_engine(SUPABASE_DB_URL)
    create_table_if_not_exists(engine)

    df = pd.DataFrame(data)

    # Optional: Remove duplicates before inserting (based on URL or name)
    df.drop_duplicates(subset=['product_url'], inplace=True)

    # Insert into Supabase
    df.to_sql('processors', engine, if_exists='append', index=False)
    print(f"✅ Uploaded {len(df)} new processor entries to Supabase.")

if __name__ == '__main__':
    data = scrape_all_processors()
    insert_into_supabase(data)
