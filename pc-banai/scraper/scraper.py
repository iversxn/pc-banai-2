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
    """Establishes a connection to the PostgreSQL database."""
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
            INSERT INTO components (id, name, category, brand, socket, chipset, memory_type, form_factor, power_consumption, specifications, images, name_bengali, last_updated)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(socket)s, %(chipset)s, %(memory_type)s, %(form_factor)s, %(power_consumption)s, %(specifications)s, %(images)s, %(name_bengali)s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, category = EXCLUDED.category, brand = EXCLUDED.brand, socket = EXCLUDED.socket,
                chipset = EXCLUDED.chipset, memory_type = EXCLUDED.memory_type, form_factor = EXCLUDED.form_factor,
                power_consumption = EXCLUDED.power_consumption, specifications = EXCLUDED.specifications,
                images = EXCLUDED.images, last_updated = NOW();
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
    """Scraper specifically for Star Tech."""
    print(f"\n--- Scraping Vendor: Star Tech ---")
    for category_name, url_path in category_map.items():
        url = f"https://www.startech.com.bd/{url_path}"
        print(f"Scraping {category_name.upper()} from: {url}")
        try:
            page = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            page.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch page {url}. Error: {e}")
            continue

        soup = BeautifulSoup(page.content, "html.parser")
        # CORRECTED SELECTOR: Star Tech now uses 'p-item-inner'
        products = soup.find_all("div", class_="p-item-inner")
        print(f"Found {len(products)} products.")

        for product in products:
            try:
                # CORRECTED SELECTORS for name, price, and stock
                name_tag = product.find("h4", class_="p-item-name").find("a")
                price_tag = product.find("div", class_="p-item-price").find("span")
                stock_tag = product.find("div", class_="p-item-button")

                # Robustness Check: Skip if essential info is missing
                if not all([name_tag, price_tag, stock_tag]):
                    print("Warning: Skipping a product card with missing name, price, or stock info.")
                    continue

                name = name_tag.text.strip()
                product_url = name_tag['href']
                price = int(re.sub(r'[^\d]', '', price_tag.text.strip()))
                in_stock = "add to cart" in stock_tag.text.strip().lower()
                
                # Create a stable ID from the product URL
                slug = product_url.split('/')[-1]
                component_id = f"{category_name}-{slug}"
                
                # Basic brand extraction
                brand_match = re.search(r'(\w+)', name)
                brand = brand_match.group(1) if brand_match else "Unknown"

                # For now, we'll use placeholder specs. A detailed page scrape can be added later.
                component = {
                    "id": component_id, "name": name, "category": category_name, "brand": brand,
                    "socket": None, "chipset": None, "memory_type": None, "form_factor": None,
                    "power_consumption": None, "specifications": Json({}),
                    "images": [img['src'] for img in product.select('.p-item-img img')],
                    "name_bengali": "", "price": price, "in_stock": in_stock, "url": product_url
                }
                upsert_component_data(conn, component, vendor_id)
                time.sleep(0.2) # Be respectful

            except Exception as e:
                print(f"Warning: Skipping a product due to a processing error: {e}")
                continue

def scrape_ryans(conn, vendor_id, category_map):
    """Template for scraping Ryans Computers."""
    print(f"\n--- Scraping Vendor: Ryans Computers (Template) ---")
    print("This scraper is a template. You need to fill in the correct selectors for Ryans.")
    # for category_name, url_path in category_map.items():
    #     url = f"https://www.ryanscomputers.com/{url_path}"
    #     # 1. Fetch the page with requests
    #     # 2. Parse with BeautifulSoup
    #     # 3. Find the correct product containers (e.g., soup.find_all("div", class_="..."))
    #     # 4. For each product, find the correct selectors for name, price, stock, etc.
    #     # 5. Populate the 'component' dictionary and call upsert_component_data
    pass

def main():
    """Main function to orchestrate scraping for all vendors."""
    
    # --- VENDOR & CATEGORY CONFIGURATION ---
    # This is where you define all vendors and the URL paths for their categories.
    # This makes the scraper highly configurable.
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
                "cpu": "https://www.ryans.com/category/desktop-component-processor",
                "motherboard": "https://www.ryans.com/category/desktop-component-motherboard",
                "ram": "https://www.ryans.com/category/desktop-component-desktop-ram",
                "gpu": "https://www.ryans.com/category/desktop-component-graphics-card",
                # Add other Ryans category paths here
            }
        }
        # Add other vendors like "techland" here in the same format.
    }

    conn = get_db_connection()
    if not conn:
        return

    try:
        for vendor_id, config in VENDORS_TO_SCRAPE.items():
            scrape_function = config["scrape_function"]
            category_map = config["categories"]
            scrape_function(conn, vendor_id, category_map)
            time.sleep(5) # Wait 5 seconds between vendors
    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
