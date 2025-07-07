#!/usr/bin/env python3
"""
Simple test script to verify Supabase Storage integration
Run this after setting up your environment variables
"""

import asyncio
import io
from PIL import Image
from app.storage import storage_service
from app.database import get_supabase


async def test_storage_service():
    """Test the storage service functionality"""
    print("🧪 Testing Supabase Storage Integration...")
    
    try:
        # Create a simple test image
        print("📷 Creating test image...")
        test_image = Image.new('RGB', (100, 100), color='red')
        img_buffer = io.BytesIO()
        test_image.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        file_content = img_buffer.getvalue()
        
        # Test upload
        print("⬆️  Testing image upload...")
        success, message, file_info = await storage_service.upload_image(
            file_content=file_content,
            original_filename="test_image.jpg",
            event_id="test-event-123"
        )
        
        if success:
            print(f"✅ Upload successful: {message}")
            print(f"📋 File info: {file_info}")
            
            # Test getting public URL
            public_url = storage_service.get_public_url(file_info['file_path'])
            print(f"🔗 Public URL: {public_url}")
            
            # Test deletion
            print("🗑️  Testing image deletion...")
            delete_success, delete_message = await storage_service.delete_image(file_info['file_path'])
            
            if delete_success:
                print(f"✅ Deletion successful: {delete_message}")
            else:
                print(f"❌ Deletion failed: {delete_message}")
        else:
            print(f"❌ Upload failed: {message}")
    
    except Exception as e:
        print(f"💥 Test failed with error: {e}")


async def test_database_connection():
    """Test database connection"""
    print("\n🔌 Testing database connection...")
    
    try:
        client = get_supabase()
        
        # Test plant_events table
        result = client.table("plant_events").select("id", count='exact').limit(1).execute()
        print(f"✅ plant_events table accessible - Count: {result.count}")
        
        # Test event_images table  
        result = client.table("event_images").select("id", count='exact').limit(1).execute()
        print(f"✅ event_images table accessible - Count: {result.count}")
        
        # Test plants table
        result = client.table("plants").select("id", count='exact').limit(1).execute()
        print(f"✅ plants table accessible - Count: {result.count}")
        
        # Test plant_varieties table
        result = client.table("plant_varieties").select("id", count='exact').limit(1).execute()
        print(f"✅ plant_varieties table accessible - Count: {result.count}")
        
        # Test storage bucket
        buckets = client.storage.list_buckets()
        harvest_bucket_exists = any(bucket.get('name') == 'harvest-images' for bucket in buckets)
        print(f"✅ Storage bucket 'harvest-images' exists: {harvest_bucket_exists}")
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")


if __name__ == "__main__":
    print("🚀 Starting Backend Image Upload Tests\n")
    
    asyncio.run(test_database_connection())
    asyncio.run(test_storage_service())
    
    print("\n✨ Test completed!")
    print("\n📝 Next steps:")
    print("1. Apply database schema: Run the SQL files in migrations/ directory in your Supabase dashboard")
    print("2. Install dependencies: pip install -r requirements.txt")
    print("3. Set environment variables for Supabase")
    print("4. Start the FastAPI server: uvicorn app.main:app --reload")
    print("5. Test the API endpoints with a tool like Postman or curl") 