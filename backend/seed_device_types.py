from app.core.database import SessionLocal
from app.models.device import DeviceType
from main import app

db = SessionLocal()

types = [
    {"name": "Laptop", "description": "Portable computers"},
    {"name": "Desktop", "description": "Workstations and towers"},
    {"name": "Laptop Battery", "description": "Internal or external laptop batteries"},
    {"name": "Laptop Charger", "description": "Power adapters and cables"},
    {"name": "Laptop Docking Station", "description": "Port replicators and docks"},
    {"name": "Laptop Keyboard", "description": "Replacement or external laptop keyboards"},
    {"name": "Laptop Screen", "description": "Replacement display panels"},
    {"name": "SSD / HDD", "description": "Internal storage drives"},
    {"name": "RAM Module", "description": "Memory upgrades"},
    {"name": "Monitor", "description": "External displays"},
    {"name": "Printer", "description": "Office and network printers"},
    {"name": "Router / Switch", "description": "Networking hardware"},
    {"name": "Mobile Device", "description": "Phones and tablets"},
    {"name": "Accessories (General)", "description": "General peripherals and cables"}
]

for t in types:
    if not db.query(DeviceType).filter(DeviceType.name == t["name"]).first():
        db.add(DeviceType(**t))

db.commit()
print("Device types seeded successfully!")
db.close()
