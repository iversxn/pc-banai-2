import os
import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
import re
import time

# Load environment variables from .env file
load_dotenv()

# --- Database Configuration ---
DB_URL = os.getenv("POSTGRES_URL")
VENDOR_ID = "startech" # The ID we used in our vendors table

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error: Could not connect to the database. {e}")
        return None

def upsert_component_data(conn, component_data):
    """
    Inserts a new component or updates it if it already exists (UPSERT).
    Also upserts the price associated with it.
    """
    with conn.cursor() as cur:
        # Step 1: Upsert the component itself
        cur.execute("""
            INSERT INTO components (id, name, category, brand, specifications, images, power_consumption)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(specifications)s, %(images)s, %(power_consumption)s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                specifications = EXCLUDED.specifications,
                images = EXCLUDED.images;
        """, component_data)

        # Step 2: Upsert the price for this component from this vendor
        cur.execute("""
            INSERT INTO prices (component_id, vendor_id, price, in_stock, url)
            VALUES (%(component_id)s, %(vendor_id)s, %(price)s, %(in_stock)s, %(url)s)
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
    print(f"Upserted: {component_data['name']}")


def scrape_startech_processors():
    """Scrapes processor data from Star Tech's website."""
    URL = "https://www.startech.com.bd/processor"
    print(f"Scraping data from: {URL}")

    try:
        page = requests.get(URL, headers={'User-Agent': 'Mozilla/5.0'})
        page.raise_for_status() # Raise an exception for bad status codes
    except requests.exceptions.RequestException as e:
        print(f"Error: Failed to retrieve the webpage. {e}")
        return

    soup = BeautifulSoup(page.content, "html.parser")
    products = soup.find_all("div", class_="p-item")
    
    if not products:
        print("No products found. The website layout might have changed.")
        return

    conn = get_db_connection()
    if not conn:
        return

    for product in products:
        try:
            name_tag = product.find("h4", class_="p-item-name").find("a")
            name = name_tag.text.strip()
            product_url = name_tag['href']

            price_text = product.find("div", class_="p-price").find("span").text.strip()
            # Clean price string: remove '৳' and commas, then convert to number
            price = int(re.sub(r'[^\d]', '', price_text))

            stock_status_tag = product.find("div", class_="actions").find("span")
            in_stock = "In Stock" in stock_status_tag.text

            # Generate a unique ID from the product name
            component_id = "cpu-" + re.sub(r'\s+', '-', name.lower())

            # Basic spec extraction (can be expanded)
            brand = "Intel" if "intel" in name.lower() else "AMD" if "amd" in name.lower() else "Unknown"
            
            component = {
                "id": component_id,
                "name": name,
                "category": "cpu",
                "brand": brand,
                "specifications": Json({}), # Placeholder for more detailed specs
                "images": [], # Placeholder for images
                "power_consumption": None, # Placeholder
                "price": price,
                "in_stock": in_stock,
                "url": product_url
            }

            upsert_component_data(conn, component)
            
            # Be a good citizen and don't spam the server
            time.sleep(0.5) 

        except (AttributeError, ValueError, TypeError) as e:
            # This will catch errors if a product card has a different structure
            print(f"Skipping a product due to parsing error: {e}")
            continue
            
    conn.close()
    print("Scraping finished.")


if __name__ == "__main__":
    scrape_startech_processors()
