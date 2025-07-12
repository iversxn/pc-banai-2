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
        # Upsert component details
        cur.execute("""
            INSERT INTO components (id, name, category, brand, specifications, images, last_updated)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(specifications)s, %(images)s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                brand = EXCLUDED.brand,
                specifications = EXCLUDED.specifications,
                images = EXCLUDED.images,
                last_updated = NOW();
        """, component_data)
        
        # Upsert price details
        cur.execute("""
            INSERT INTO prices (component_id, vendor_id, price, in_stock, url, last_updated)
            VALUES (%(component_id)s, %(vendor_id)s, %(price)s, %(in_stock)s, %(url)s, NOW())
            ON CONFLICT (component_id, vendor_id) DO UPDATE SET
                price = EXCLUDED.price,
                in_stock = EXCLUDED.in_stock,
                url = EXCLUDED.url,
                last_updated = NOW();
        """, {
            "component_id": component_data['id'], "vendor_id": vendor_id, "price": component_data['price'],
            "in_stock": component_data['in_stock'], "url": component_data['url']
        })
    conn.commit()
    print(f"  -> Upserted: {component_data['name']} for {vendor_id}")

# --- Vendor-Specific Scraping Logic ---

def scrape_startech(conn, vendor_id, category_map):
    """Scraper specifically for Star Tech with corrected selectors."""
    print(f"\n--- Scraping Vendor: Star Tech ---")
    for category_name, url in category_map.items():
        print(f"Scraping {category_name.upper()} from: {url}")
        try:
            page = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
            page.raise_for_status()
            print(f"Successfully fetched page: {url}")
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch page {url}. Error: {e}")
            continue

        soup = BeautifulSoup(page.content, "html.parser")
        # CORRECTED SELECTOR: The container for each product.
        products = soup.find_all("div", class_="p-item-inner")
        print(f"Found {len(products)} products in {category_name}.")

        for product in products:
            try:
                # CORRECTED SELECTORS for name, price, and stock elements within the container.
                name_tag = product.find("h4", class_="p-item-name").find("a")
                price_tag = product.find("div", class_="p-item-price").find("span")
                stock_tag = product.find("div", class_="p-item-button")

                if not all([name_tag, price_tag, stock_tag]):
                    print("Warning: Skipping a product card with missing name, price, or stock info.")
                    continue

                name = name_tag.text.strip()
                product_url = name_tag['href']
                price = int(re.sub(r'[^\d]', '', price_tag.text.strip()))
                in_stock = "add to cart" in stock_tag.text.strip().lower()
                
                slug = product_url.split('/')[-1]
                component_id = f"{category_name}-{slug}"
                brand = name.split(' ')[0]

                component = {
                    "id": component_id, "name": name, "category": category_name, "brand": brand,
                    "specifications": Json({}), "images": [img['src'] for img in product.select('.p-item-img img')],
                    "price": price, "in_stock": in_stock, "url": product_url
                }
                upsert_component_data(conn, component, vendor_id)
                time.sleep(0.2)

            except Exception as e:
                print(f"Warning: Skipping a product due to a processing error: {e}")
                continue

def scrape_ryans(conn, vendor_id, category_map):
    """Template for scraping Ryans Computers. This needs its own specific selectors."""
    print(f"\n--- Scraping Vendor: Ryans Computers (Template) ---")
    print("This scraper is a template. To make it work, you must inspect ryanscomputers.com and find the correct HTML selectors for their product list.")
    pass

def main():
    """Main function to orchestrate scraping for all vendors."""
    
    # --- VENDOR & CATEGORY CONFIGURATION ---
    # This is the central place to manage what gets scraped.
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
                # You would add more Ryans URLs here
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
            # Call the specific scrape function for the vendor
            scrape_function(conn, vendor_id, category_map)
            time.sleep(5) # A polite pause between scraping different vendors
    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
