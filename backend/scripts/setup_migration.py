#!/usr/bin/env python3
"""
Plant Journey Migration Script
This script sets up the new plant journey schema and migrates existing harvest data.

⚠️ DEPRECATED: This script is for initial setup/migration only.
For production deployments, use the SQL files in the migrations/ directory directly.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

def load_environment():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print("❌ .env file not found. Please create it with your Supabase credentials.")
        return None
    
    load_dotenv(env_path)
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not service_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file")
        return None
    
    # Parse the database URL from Supabase URL
    # Supabase PostgreSQL connection format
    parsed_url = urlparse(supabase_url)
    host = parsed_url.hostname.replace('supabase.co', 'supabase.co').replace('https://', '')
    
    # Construct PostgreSQL connection string
    # Note: You'll need the actual database credentials from Supabase dashboard
    db_config = {
        'host': f"db.{parsed_url.hostname.split('.')[0]}.supabase.co",
        'database': 'postgres',
        'user': 'postgres',
        'password': None,  # Need to get this from Supabase dashboard
        'port': 5432
    }
    
    return {
        'supabase_url': supabase_url,
        'service_key': service_key,
        'db_config': db_config
    }

def execute_sql_file(connection, file_path):
    """Execute SQL file against the database"""
    try:
        with open(file_path, 'r') as file:
            sql_content = file.read()
        
        cursor = connection.cursor()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                print(f"   Executing statement {i+1}/{len(statements)}...")
                cursor.execute(statement)
        
        connection.commit()
        cursor.close()
        
        print(f"✅ Successfully executed {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error executing {file_path}: {str(e)}")
        connection.rollback()
        return False

def check_existing_data(connection):
    """Check existing harvest data"""
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM harvest_logs")
        harvest_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM harvest_images")
        image_count = cursor.fetchone()[0]
        
        cursor.close()
        
        print(f"📊 Found {harvest_count} harvest logs and {image_count} images")
        return harvest_count, image_count
        
    except Exception as e:
        print(f"❌ Error checking existing data: {str(e)}")
        return 0, 0

def main():
    print("🌱 Plant Journey Migration Script")
    print("=" * 50)
    
    # Load environment
    env_config = load_environment()
    if not env_config:
        return 1
    
    print("📋 Migration Plan:")
    print("   1. Setup new plant journey schema")
    print("   2. Migrate existing harvest data")
    print("   3. Validate data integrity")
    print()
    
    # Note: This script requires direct database access
    print("⚠️  IMPORTANT: This script requires direct PostgreSQL access to your Supabase database.")
    print("   You can execute the SQL files manually in the Supabase dashboard instead:")
    print(f"   1. Execute: setup_plant_journey.sql")
    print(f"   2. Execute: migrate_to_plant_journey.sql")
    print()
    
    # Check if we should continue with manual instructions
    response = input("Do you want to see the manual migration instructions? (y/n): ").lower()
    
    if response == 'y':
        print("\n📖 Manual Migration Instructions:")
        print("=" * 40)
        print()
        print("1. Open your Supabase dashboard")
        print("2. Go to the SQL Editor")
        print("3. Copy and paste the contents of 'setup_plant_journey.sql'")
        print("4. Execute the script")
        print("5. Copy and paste the contents of 'migrate_to_plant_journey.sql'")
        print("6. Execute the migration script")
        print("7. Check the migration results in the output")
        print()
        print("📁 Files to execute:")
        print(f"   - {Path(__file__).parent / 'setup_plant_journey.sql'}")
        print(f"   - {Path(__file__).parent / 'migrate_to_plant_journey.sql'}")
        print()
        print("✅ After migration, update your backend to use the new routers:")
        print("   - Add plants.py and events.py routers to main.py")
        print("   - Update frontend to use new API endpoints")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())