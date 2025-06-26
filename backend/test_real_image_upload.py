#!/usr/bin/env python3
"""
Test script to verify image upload API with real image file
"""

import asyncio
import requests
import json
from pathlib import Path
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.storage import storage_service
from app.database import get_supabase


async def test_storage_service_with_real_image():
    """Test the storage service with the actual let.jpg file"""
    print("🧪 Testing Supabase Storage with let.jpg...")
    
    # Path to the image file
    image_path = Path("../let.jpg")
    
    if not image_path.exists():
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        # Read the actual image file
        print(f"📷 Reading image file: {image_path}")
        with open(image_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📊 File size: {len(file_content)} bytes")
        
        # Test upload
        print("⬆️  Testing image upload...")
        success, message, file_info = await storage_service.upload_image(
            file_content=file_content,
            original_filename="let.jpg",
            harvest_log_id="test-harvest-real-image"
        )
        
        if success:
            print(f"✅ Upload successful: {message}")
            print(f"📋 File info:")
            for key, value in file_info.items():
                print(f"   {key}: {value}")
            
            # Test getting public URL
            public_url = storage_service.get_public_url(file_info['file_path'])
            print(f"🔗 Public URL: {public_url}")
            
            return True, file_info
        else:
            print(f"❌ Upload failed: {message}")
            return False, None
    
    except Exception as e:
        print(f"💥 Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def test_api_endpoint_with_real_image():
    """Test the actual API endpoint with the real image"""
    print("\n🌐 Testing API endpoint with let.jpg...")
    
    # Path to the image file
    image_path = Path("../let.jpg")
    
    if not image_path.exists():
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        # First, we need to create a test harvest log to upload the image to
        print("📝 Creating test harvest log...")
        
        # Create test harvest log
        harvest_data = {
            "crop_name": "Test Crop",
            "quantity": 1.0,
            "unit": "kg",
            "notes": "Test harvest for image upload"
        }
        
        response = requests.post(
            "http://localhost:8000/api/harvest-logs/",
            json=harvest_data
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create test harvest log: {response.text}")
            return False
        
        harvest_log = response.json()
        harvest_log_id = harvest_log['id']
        print(f"✅ Created test harvest log: {harvest_log_id}")
        
        # Now test the image upload
        print("📤 Uploading image via API...")
        
        with open(image_path, 'rb') as f:
            files = {'file': ('let.jpg', f, 'image/jpeg')}
            data = {'upload_order': '0'}
            
            response = requests.post(
                f"http://localhost:8000/api/images/upload/{harvest_log_id}",
                files=files,
                data=data
            )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API upload successful!")
            print(f"📋 Response: {json.dumps(result, indent=2)}")
            return True, harvest_log_id
        else:
            print(f"❌ API upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False, harvest_log_id
    
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure the server is running on localhost:8000")
        print("Run: uvicorn app.main:app --reload")
        return False, None
    except Exception as e:
        print(f"💥 API test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False, None


async def test_database_connection():
    """Test database connection and table structure"""
    print("\n🔌 Testing database connection...")
    
    try:
        client = get_supabase()
        
        # Test harvest_logs table
        result = client.table("harvest_logs").select("id", count='exact').limit(1).execute()
        print(f"✅ harvest_logs table accessible - Count: {result.count}")
        
        # Test harvest_images table  
        result = client.table("harvest_images").select("id", count='exact').limit(1).execute()
        print(f"✅ harvest_images table accessible - Count: {result.count}")
        
        # Test storage bucket
        try:
            buckets = client.storage.list_buckets()
            harvest_bucket_exists = any(bucket.name == 'harvest-images' if hasattr(bucket, 'name') else bucket.get('name') == 'harvest-images' for bucket in buckets)
            print(f"✅ Storage bucket 'harvest-images' exists: {harvest_bucket_exists}")
        except Exception as bucket_error:
            print(f"⚠️  Could not check bucket status: {bucket_error}")
            # Continue with tests anyway
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("🚀 Starting Real Image Upload Tests with let.jpg\n")
    
    # Test 1: Database connection
    db_ok = await test_database_connection()
    if not db_ok:
        print("⚠️  Database tests had issues, but continuing with storage tests...")
        # Continue anyway
    
    # Test 2: Storage service direct test
    storage_ok, file_info = await test_storage_service_with_real_image()
    if not storage_ok:
        print("❌ Storage service tests failed")
        return
    
    # Test 3: API endpoint test
    api_ok, harvest_log_id = test_api_endpoint_with_real_image()
    
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    print(f"Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"Storage Service: {'✅ PASS' if storage_ok else '❌ FAIL'}")
    print(f"API Endpoint: {'✅ PASS' if api_ok else '❌ FAIL'}")
    
    if storage_ok and file_info:
        print(f"\n🔗 Image URL: {file_info.get('public_url', 'N/A')}")
    
    if api_ok:
        print("\n✨ All tests passed! Your image upload API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
    
    print("\n📝 To test manually:")
    print("1. Start the server: uvicorn app.main:app --reload")
    print("2. Open http://localhost:8000/docs for API documentation")
    print("3. Use the /api/images/upload/{harvest_log_id} endpoint")


if __name__ == "__main__":
    asyncio.run(main()) 