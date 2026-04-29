"""
Run this script to:
1. Create all tables in the production PostgreSQL database
2. Seed device types
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ['DATABASE_URL'] = (
    'postgresql://ticketing_db_e3kf_user:5VNPM9XdS2lvFNwjCGQ6UDNTJENNpCBp'
    '@dpg-d7o9ugreo5us739p242g-a.oregon-postgres.render.com/ticketing_db_e3kf'
)

from app.core.database import engine, Base, SessionLocal
from app.models import user, company, ticket, device  # Import all models so Base knows about them

# 1. Create all tables
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# 2. Check what tables exist
import sqlalchemy
with engine.connect() as conn:
    result = conn.execute(sqlalchemy.text(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    ))
    tables = [r[0] for r in result.fetchall()]
    print(f"Tables in DB: {tables}")

# 3. Seed device types
from app.models.device import DeviceType

device_types = [
    {"name": "Laptop",                  "description": "Portable computers"},
    {"name": "Desktop",                 "description": "Workstations and towers"},
    {"name": "Laptop Battery",          "description": "Internal or external laptop batteries"},
    {"name": "Laptop Charger",          "description": "Power adapters and cables"},
    {"name": "Laptop Docking Station",  "description": "Port replicators and docks"},
    {"name": "Laptop Keyboard",         "description": "Replacement or external laptop keyboards"},
    {"name": "Laptop Screen",           "description": "Replacement display panels"},
    {"name": "SSD / HDD",              "description": "Internal storage drives"},
    {"name": "NVMe",                   "description": "NVMe SSD storage drives"},
    {"name": "RAM Module",              "description": "Memory upgrades"},
    {"name": "Monitor",                 "description": "External displays"},
    {"name": "Printer",                 "description": "Office and network printers"},
    {"name": "Router / Switch",         "description": "Networking hardware"},
    {"name": "Mobile Device",           "description": "Phones and tablets"},
    {"name": "Webcam",                  "description": "External or internal cameras"},
    {"name": "Microphone",              "description": "Audio input devices"},
    {"name": "USB Hub",                 "description": "USB splitters and hubs"},
    {"name": "Motherboard",             "description": "Main circuit board"},
    {"name": "Power Supply",            "description": "PSU units"},
    {"name": "Graphics Card",           "description": "GPU for rendering"},
    {"name": "Processor",               "description": "CPU / Microprocessors"},
    {"name": "Cooling Fan",             "description": "Case fans and CPU coolers"},
    {"name": "Network Card",            "description": "NIC / Wi-Fi cards"},
    {"name": "Sound Card",              "description": "Audio interface cards"},
    {"name": "Cables / Connectors",     "description": "HDMI, DisplayPort, Ethernet cables"},
    {"name": "Accessories (General)",   "description": "General peripherals and cables"},
    {"name": "Docker / Tools",          "description": "Docking stations and tools"},
]

db = SessionLocal()
added = 0
for t in device_types:
    exists = db.query(DeviceType).filter(DeviceType.name == t["name"]).first()
    if not exists:
        db.add(DeviceType(**t))
        added += 1

db.commit()
db.close()
print(f"Device types seeded: {added} new types added.")
print("Done! Production DB is ready.")
