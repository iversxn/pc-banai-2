import os
import re
import time
import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Database & Vendor Configuration ---
# It's good practice to fetch this from environment variables
# to avoid hardcoding credentials in the script.
DB_URL = os.getenv("POSTGRES_URL")
VENDOR_ID = "startech"  # The ID for Star Tech in your 'vendors' table

def get_db_connection():
    """Establishes a robust connection to the PostgreSQL database."""
    if not DB_URL:
        print("Error: POSTGRES_URL environment variable not set.")
        return None
    try:
        conn = psycopg2.connect(DB_URL)
        print("Database connection established successfully.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error: Could not connect to the database. {e}")
        return None

def upsert_component_and_price(conn, component_data):
    """
    Inserts or updates a component and its price from a specific vendor.
    This function is now more generic to handle different components.
    """
    with conn.cursor() as cur:
        # Upsert the main component details
        cur.execute("""
            INSERT INTO components (id, name, category, brand, specifications, images, power_consumption, name_bengali)
            VALUES (%(id)s, %(name)s, %(category)s, %(brand)s, %(specifications)s, %(images)s, %(power_consumption)s, %(name_bengali)s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                brand = EXCLUDED.brand,
                specifications = EXCLUDED.specifications,
                images = EXCLUDED.images,
                power_consumption = EXCLUDED.power_consumption,
                name_bengali = EXCLUDED.name_bengali;
        """, component_data)

        # Upsert the price details for the vendor
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
    print(f"Upserted: {component_data['name']}")

def scrape_category(conn, category_name, url):
    """
    A generic function to scrape a category page from Star Tech.
    This can be reused for CPUs, Motherboards, RAM, etc.
    """
    print(f"Scraping {category_name} from: {url}")
    try:
        page = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        page.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: Failed to retrieve the webpage for {category_name}. {e}")
        return

    soup = BeautifulSoup(page.content, "html.parser")
    products = soup.find_all("div", class_="p-item")

    if not products:
        print(f"No products found for {category_name}. The website layout may have changed.")
        return

    for product in products:
        try:
            name_tag = product.find("h4", class_="p-item-name").find("a")
            name = name_tag.text.strip()
            product_url = name_tag['href']

            price_text = product.find("div", class_="p-price").find("span").text.strip()
            price = int(re.sub(r'[^\d]', '', price_text))

            stock_status_text = product.find("div", class_="actions").find("span").text.strip().lower()
            in_stock = "in stock" in stock_status_text or "add to cart" in stock_status_text

            # Generate a more stable ID from the URL slug
            slug = product_url.split('/')[-1]
            component_id = f"{category_name}-{slug}"

            brand = "Unknown"
            if "intel" in name.lower():
                brand = "Intel"
            elif "amd" in name.lower():
                brand = "AMD"
            elif "gigabyte" in name.lower():
                brand = "Gigabyte"
            elif "msi" in name.lower():
                brand = "MSI"
            elif "asus" in name.lower():
                brand = "Asus"

            # This data can be enriched by visiting the product_url and scraping details
            component = {
                "id": component_id,
                "name": name,
                "category": category_name,
                "brand": brand,
                "specifications": Json({}),  # Placeholder for detailed specs
                "images": [img['src'] for img in product.select('.p-item-img img')], # Basic image scraping
                "power_consumption": None,  # Placeholder, requires detailed scraping
                "name_bengali": "", # Placeholder for Bengali name
                "price": price,
                "in_stock": in_stock,
                "url": product_url
            }

            upsert_component_and_price(conn, component)
            time.sleep(0.5)  # Be respectful to the server

        except (AttributeError, ValueError, TypeError) as e:
            print(f"Skipping a product in {category_name} due to a parsing error: {e}")
            continue

def main():
    """Main function to run the scrapers."""
    conn = get_db_connection()
    if not conn:
        return

    try:
        # --- Define categories and their URLs to scrape ---
        # You can easily add more categories here
        scrape_targets = {
            "cpu": "https://www.startech.com.bd/processor",
            "motherboard": "https://www.startech.com.bd/motherboard",
            # "ram": "https://www.startech.com.bd/component/ram",
            # "gpu": "https://www.startech.com.bd/component/graphics-card",
        }

        for category, url in scrape_targets.items():
            scrape_category(conn, category, url)
            # Add a longer delay between categories
            time.sleep(2)

    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()
