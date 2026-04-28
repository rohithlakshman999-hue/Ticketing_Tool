from app.core.database import SessionLocal
from app.models.device import DeviceType

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
    {"name": "Accessories (General)", "description": "General peripherals and cables"},
]

try:
    print("🌱 Seeding device types...\n")

    added_count = 0
    skipped_count = 0

    for t in types:
        exists = db.query(DeviceType).filter(DeviceType.name == t["name"]).first()

        if not exists:
            db.add(DeviceType(**t))
            added_count += 1
            print(f"✅ Added: {t['name']}")
        else:
            skipped_count += 1
            print(f"⚠️ Skipped (already exists): {t['name']}")

    db.commit()

    print("\n🎉 Seeding completed!")
    print(f"Added: {added_count} | Skipped: {skipped_count}")

except Exception as e:
    db.rollback()
    print("❌ Error during seeding:", str(e))

finally:
    db.close()