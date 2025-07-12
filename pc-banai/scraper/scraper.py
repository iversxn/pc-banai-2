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
# The workflow now provides the definitive, IP-based URL to this variable.
DB_URL = os.getenv("POSTGRES_URL")
VENDOR_ID = "startech"

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    if not DB_URL:
        print("Error: POSTGRES_URL environment variable was not provided by the workflow.")
        return None
    try:
        # This will now connect using the IP address provided by the workflow
        conn = psycopg2.connect(DB_URL)
        print("Database connection established successfully.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error connecting to database: {e}")
        return None

def scrape_product_details(product_url):
    """Scrapes detailed specifications from an individual product page."""
    print(f"  - Scraping details from: {product_url}")
    try:
        page = requests.get(product_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        page.raise_for_status()
        soup = BeautifulSoup(page.content, "html.parser")
        
        specs = {}
        # This dictionary maps the text found on the website to your DB column names
        key_mapping = {
            'socket': 'socket',
            'chipset': 'chipset',
            'supported_memory': 'memory_type',
            'form_factor': 'form_factor',
            'power_consumption': 'power_consumption'
        }
        
        # This will hold the extracted values for the dedicated columns
        extracted_data = {
            'socket': None,
            'chipset': None,
            'memory_type': None,
            'form_factor': None,
            'power_consumption': None
        }

        spec_table = soup.find("table", class_="data-table")
        if spec_table:
            for row in spec_table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) == 2:
                    key_raw = cells[0].text.strip().lower()
                    key_clean = re.sub(r'\s+', '_', key_raw)
                    value = cells[1].text.strip()
                    
                    # Check if this key is one we want for a dedicated column
                    for map_key, db_col in key_mapping.items():
                        if map_key in key_clean:
                            extracted_data[db_col] = value
                            break
                    else: # If it's not a dedicated key, add to the JSONB field
                        specs[key_clean] = value

        # Post-process power consumption to get an integer
        if extracted_data['power_consumption']:
            match = re.search(r'(\d+)', extracted_data['power_consumption'])
            if match:
                extracted_data['power_consumption'] = int(match.group(1))
            else:
                extracted_data['power_consumption'] = None # No number found

        return extracted_data, specs

    except requests.exceptions.RequestException as e:
        print(f"  - Error fetching product page: {e}")
        return {k: None for k in key_mapping}, {}
    except Exception as e:
        print(f"  - Error parsing product details: {e}")
        return {k: None for k in key_mapping}, {}


def upsert_component_data(conn, component_data):
    """Inserts or updates a component, now including dedicated spec columns."""
    with conn.cursor() as cur:
        # This SQL statement now includes the dedicated columns
        cur.execute("""
            INSERT INTO components (id, name, category, brand, socket, chipset, memory_type, form_factor, power_consumption, specifications, images, name_bengali)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(socket)s, %(chipset)s, %(memory_type)s, %(form_factor)s, %(power_consumption)s, %(specifications)s, %(images)s, %(name_bengali)s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                brand = EXCLUDED.brand,
                socket = EXCLUDED.socket,
                chipset = EXCLUDED.chipset,
                memory_type = EXCLUDED.memory_type,
                form_factor = EXCLUDED.form_factor,
                power_consumption = EXCLUDED.power_consumption,
                specifications = EXCLUDED.specifications,
                images = EXCLUDED.images,
                last_updated = NOW();
        """, component_data)

        # The prices table logic remains the same
        cur.execute("""
            INSERT INTO prices (component_id, vendor_id, price, in_stock, url, last_updated)
            VALUES (%(component_id)s, %(vendor_id)s, %(price)s, %(in_stock)s, %(url)s, NOW())
            ON CONFLICT (component_id, vendor_id) DO UPDATE SET
                price = EXCLUDED.price,
                in_stock = EXCLUDED.in_stock,
                url = EXCLUDED.url,
                last_updated = NOW();
        """, {
            "component_id": component_data['id'],
            "vendor_id": VENDOR_ID,
            "price": component_data['price'],
            "in_stock": component_data['in_stock'],
            "url": component_data['url']
        })
    conn.commit()
    print(f"  -> Upserted: {component_data['name']}")

def scrape_category(conn, category_name, url):
    """Scrapes a category page and then drills down into each product."""
    print(f"\n--- Scraping Category: {category_name.upper()} ---")
    # ... (This part is largely the same, but now passes the extracted data)

def main():
    """Main function to run the scrapers."""
    conn = get_db_connection()
    if not conn:
        return

    try:
        scrape_targets = {
            "cpu": "https://www.startech.com.bd/processor",
            "motherboard": "https://www.startech.com.bd/motherboard",
            "ram": "https://www.startech.com.bd/component/ram",
            "gpu": "https://www.startech.com.bd/component/graphics-card",
        }

        for category, url in scrape_targets.items():
            scrape_category(conn, category, url)
            time.sleep(2)

    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
