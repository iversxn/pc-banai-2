import os
import re
import time
import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
VENDOR_ID = "startech" # Define the vendor ID for this scraper

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    if not DB_URL:
        print("::error::FATAL: The DATABASE_URL environment variable was not found.")
        return None
    try:
        hostname = DB_URL.split('@')[1].split(':')[0]
        print(f"Attempting to connect to database host: {hostname}")
        conn = psycopg2.connect(DB_URL)
        print("Database connection established successfully.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"::error::Failed to connect to the database. Error: {e}")
        return None

def scrape_product_details(product_url):
    """Scrapes detailed specifications from a single product page."""
    print(f"  - Scraping details from: {product_url}")
    try:
        page = requests.get(product_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        page.raise_for_status()
        soup = BeautifulSoup(page.content, "html.parser")
        
        specs = {}
        key_mapping = {
            'socket': 'socket', 'chipset': 'chipset', 'supported_memory': 'memory_type',
            'form_factor': 'form_factor', 'power_consumption': 'power_consumption'
        }
        extracted_data = {k: None for k in key_mapping.values()}

        spec_table = soup.find("table", class_="data-table")
        if spec_table:
            for row in spec_table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) == 2:
                    key_raw = cells[0].text.strip().lower()
                    key_clean = re.sub(r'\s+', '_', key_raw)
                    value = cells[1].text.strip()
                    
                    for map_key, db_col in key_mapping.items():
                        if map_key in key_clean:
                            extracted_data[db_col] = value
                            break
                    else:
                        specs[key_clean] = value

        if extracted_data.get('power_consumption'):
            match = re.search(r'(\d+)', extracted_data['power_consumption'])
            extracted_data['power_consumption'] = int(match.group(1)) if match else None

        return extracted_data, specs
    except Exception as e:
        print(f"  - Error parsing product details: {e}")
        return {k: None for k in key_mapping.values()}, {}

def upsert_component_data(conn, component_data):
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
            "component_id": component_data['id'], "vendor_id": VENDOR_ID, "price": component_data['price'],
            "in_stock": component_data['in_stock'], "url": component_data['url']
        })
    conn.commit()
    print(f"  -> Upserted: {component_data['name']}")

def scrape_startech_category(conn, category_name, url):
    """Scrapes a category page from Star Tech using updated selectors."""
    print(f"\n--- Scraping Star Tech Category: {category_name.upper()} ---")
    try:
        page = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        page.raise_for_status()
        print(f"Successfully fetched page: {url}")
    except requests.exceptions.RequestException as e:
        print(f"::error::Error retrieving category page: {e}")
        return

    soup = BeautifulSoup(page.content, "html.parser")
    
    # CORRECTED SELECTOR: Find the main container for all product items.
    product_container = soup.find("div", class_="p-items-wrap")
    
    if not product_container:
        print(f"::warning::Could not find the main product container ('div.p-items-wrap') on the page. The website layout has likely changed.")
        return

    # CORRECTED SELECTOR: Find all individual product items within that container.
    products = product_container.find_all("div", class_="p-item")
    
    if not products:
        print(f"::warning::Found the product container, but it contains no items with the selector 'div.p-item'. The product item class may have changed.")
        return

    print(f"Found {len(products)} products in {category_name}.")

    for product in products:
        try:
            name_tag = product.find("h4", class_="p-item-name").find("a")
            price_tag = product.find("div", class_="p-price").find("span")
            
            if not name_tag or not price_tag:
                print("::warning::Skipping a product because name or price tag was not found.")
                continue

            name = name_tag.text.strip()
            product_url = name_tag['href']
            price_text = price_tag.text.strip()
            price = int(re.sub(r'[^\d]', '', price_text))
            
            stock_status_tag = product.find("div", class_="actions").find("span")
            in_stock = "in stock" in stock_status_tag.text.strip().lower() or "add to cart" in stock_status_tag.text.strip().lower() if stock_status_tag else False

            slug = product_url.split('/')[-1]
            component_id = f"{category_name}-{slug}"
            brand_match = re.search(r'(\w+)', name)
            brand = brand_match.group(1) if brand_match else "Unknown"

            extracted_data, other_specs = scrape_product_details(product_url)

            component = {
                "id": component_id, "name": name, "category": category_name, "brand": brand,
                "socket": extracted_data.get('socket'), "chipset": extracted_data.get('chipset'),
                "memory_type": extracted_data.get('memory_type'), "form_factor": extracted_data.get('form_factor'),
                "power_consumption": extracted_data.get('power_consumption'),
                "specifications": Json(other_specs),
                "images": [img['src'] for img in product.select('.p-item-img img')],
                "name_bengali": "", "price": price, "in_stock": in_stock, "url": product_url
            }
            upsert_component_data(conn, component)
            time.sleep(0.5)
        except Exception as e:
            print(f"::warning::Skipping a product due to a processing error: {e}")
            continue

def main():
    """Main function to initialize and run the scrapers for all vendors."""
    conn = get_db_connection()
    if not conn:
        return

    try:
        # Using the corrected, working URLs for Star Tech
        startech_targets = {
            "cpu": "https://www.startech.com.bd/processor",
            "motherboard": "https://www.startech.com.bd/motherboard",
            "ram": "https://www.startech.com.bd/component/ram",
            "gpu": "https://www.startech.com.bd/component/graphics-card"
        }
        for category, url in startech_targets.items():
            scrape_startech_category(conn, category, url)
            time.sleep(2)

    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
