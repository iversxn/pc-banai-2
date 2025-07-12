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
    name = card.select_one('h4 > a').text.strip()
    url = card.select_one('h4 > a')['href']

    # Safe image handling
    img_tag = card.select_one('img.img-fluid')
    if img_tag:
        image_url = img_tag.get('data-src') or img_tag.get('src', 'N/A')
    else:
        image_url = 'N/A'

    # Price
    price = card.select_one('.price')
    price = price.text.strip().replace(',', '').replace('৳', '').strip() if price else 'N/A'

    # Availability
    availability = card.select_one('.p-status')
    availability = availability.text.strip() if availability else 'N/A'

    # Brand
    brand_img = card.select_one('.product-brand > img')
    brand = brand_img['alt'] if brand_img and brand_img.has_attr('alt') else 'N/A'

    # Specs
    specs_list = card.select('div.p-item-details ul li')
    specs = ' | '.join([li.text.strip() for li in specs_list]) if specs_list else 'N/A'

    return {
        'product_name': name,
        'price_bdt': price,
        'product_url': url,
        'image_url': image_url,
        'availability': availability,
        'brand': brand,
        'short_specs': specs
    }


def scrape_all_processors():
    all_data = []
    total_pages = get_total_pages()
    print(f"Found {total_pages} pages. Starting scrape...\n")

    for page in range(1, total_pages + 1):
        print(f"Scraping page {page} of {total_pages}...")
        url = f"{BASE_URL}?page={page}"
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, 'html.parser')
        products = soup.select('div.p-item')

        for product in products:
            item = parse_product(product)
            all_data.append(item)

        time.sleep(1.5)  # Respect server

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
