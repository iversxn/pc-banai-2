import os
import re
import time
import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
DB_URL = os.getenv("DATABASE_URL")
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
}

def get_db_connection():
    """Establishes a robust connection to the PostgreSQL database."""
    if not DB_URL:
        print("::error::FATAL: The DATABASE_URL environment variable was not found.")
        return None
    try:
        conn = psycopg2.connect(DB_URL)
        print("Database connection established successfully.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"::error::Failed to connect to the database. Error: {e}")
        return None

def upsert_component_data(conn, component_data, vendor_id):
    """Inserts or updates a component and its price for a specific vendor."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO components (id, name, category, brand, specifications, images, last_updated)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(specifications)s, %(images)s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, category = EXCLUDED.category, brand = EXCLUDED.brand,
                specifications = EXCLUDED.specifications, images = EXCLUDED.images, last_updated = NOW();
        """, component_data)
        
        cur.execute("""
            INSERT INTO prices (component_id, vendor_id, price, in_stock, url, last_updated)
            VALUES (%(component_id)s, %(vendor_id)s, %(price)s, %(in_stock)s, %(url)s, NOW())
            ON CONFLICT (component_id, vendor_id) DO UPDATE SET
                price = EXCLUDED.price, in_stock = EXCLUDED.in_stock, url = EXCLUDED.url, last_updated = NOW();
        """, {
            "component_id": component_data['id'], "vendor_id": vendor_id, "price": component_data['price'],
            "in_stock": component_data['in_stock'], "url": component_data['url']
        })
    conn.commit()
    print(f"  -> Upserted: {component_data['name']} for {vendor_id}")

# --- Vendor-Specific Scraping Logic ---

def scrape_startech(conn, vendor_id, category_map):
    """
    Scraper for Star Tech, incorporating user-provided pagination and selectors.
    """
    print(f"\n--- Scraping Vendor: Star Tech ---")

    def get_total_pages(url):
        """Finds the total number of pagination pages for a given category URL."""
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            pages = soup.select('ul.pagination li a.page-link')
            page_numbers = [int(a.text.strip()) for a in pages if a.text.strip().isdigit()]
            return max(page_numbers) if page_numbers else 1
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not determine total pages for {url}. Defaulting to 1. Error: {e}")
            return 1

    for category_name, base_url in category_map.items():
        total_pages = get_total_pages(base_url)
        print(f"Found {total_pages} pages for {category_name.upper()}. Starting scrape...")

        for page in range(1, total_pages + 1):
            url = f"{base_url}?page={page}"
            print(f"Scraping page {page}/{total_pages} from: {url}")
            try:
                response = requests.get(url, headers=HEADERS, timeout=15)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(f"Warning: Could not fetch page {url}. Skipping. Error: {e}")
                continue

            soup = BeautifulSoup(response.content, 'html.parser')
            products = soup.select('div.p-item')

            for card in products:
                try:
                    name = card.select_one('h4 > a').text.strip()
                    product_url = card.select_one('h4 > a')['href']
                    price_str = card.select_one('.p-item-price, .price').text.strip().replace(',', '')
                    price = int(re.sub(r'[^\d]', '', price_str))
                    
                    availability_tag = card.select_one('.p-item-button .actions .action-btn, .p-status')
                    in_stock = "add to cart" in availability_tag.text.strip().lower() if availability_tag else False
                    
                    brand = name.split(' ')[0]
                    slug = product_url.split('/')[-1]
                    component_id = f"{category_name}-{slug}"
                    
                    # Convert short specs to a JSON object
                    specs_list = [li.text.strip() for li in card.select('div.p-item-details ul li')]
                    specifications = {s.split(':')[0].strip(): s.split(':')[1].strip() for s in specs_list if ':' in s}

                    component = {
                        "id": component_id, "name": name, "category": category_name, "brand": brand,
                        "specifications": Json(specifications),
                        "images": [img['src'] for img in card.select('img.img-fluid')],
                        "price": price, "in_stock": in_stock, "url": product_url
                    }
                    upsert_component_data(conn, component, vendor_id)
                except Exception as e:
                    print(f"Warning: Skipping a product due to a processing error: {e}")
                    continue
            time.sleep(1.5) # Respectful pause between pages

def scrape_ryans(conn, vendor_id, category_map):
    """Template for scraping Ryans Computers."""
    print(f"\n--- Scraping Vendor: Ryans Computers (Template) ---")
    print("This scraper is a template. To make it work, you must inspect ryanscomputers.com and find the correct HTML selectors.")
    pass

def main():
    """Main function to orchestrate scraping for all vendors."""
    VENDORS_TO_SCRAPE = {
        "startech": {
            "scrape_function": scrape_startech,
            "categories": {
                "cpu": "https://www.startech.com.bd/component/processor",
                "motherboard": "https://www.startech.com.bd/component/motherboard",
                "ram": "https://www.startech.com.bd/component/ram",
                "gpu": "https://www.startech.com.bd/component/graphics-card",
            }
        },
        "ryans": {
            "scrape_function": scrape_ryans,
            "categories": {
                "cpu": "https://www.ryanscomputers.com/category/processor",
            }
        }
    }

    conn = get_db_connection()
    if not conn:
        return

    try:
        for vendor_id, config in VENDORS_TO_SCRAPE.items():
            scrape_function = config["scrape_function"]
            category_map = config["categories"]
            scrape_function(conn, vendor_id, category_map)
            time.sleep(5)
    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
