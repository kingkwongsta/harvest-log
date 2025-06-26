#!/usr/bin/env python3
"""
Test script to verify image URL functionality
"""

import asyncio
import os
from supabase import create_client
from app.config import settings
from app.storage import storage_service
from app.dependencies import get_all_harvest_logs_from_db

async def test_image_urls():
    """Test that image URLs are being generated correctly"""
    
    # Initialize Supabase client
    supabase = create_client(
        settings.supabase_url,
        settings.supabase_service_key or settings.supabase_anon_key
    )
    
    print("🔧 Testing image URL functionality...")
    
    try:
        # Get all harvest logs with images
        print("📋 Fetching harvest logs...")
        harvest_logs = await get_all_harvest_logs_from_db(supabase, "test-script")
        
        print(f"📊 Found {len(harvest_logs)} harvest logs")
        
        # Check images and update public URLs if needed
        updated_count = 0
        for log in harvest_logs:
            if log.images:
                print(f"🖼️  Harvest '{log.crop_name}' has {len(log.images)} images")
                
                for image in log.images:
                    print(f"   Image: {image.filename}")
                    print(f"   File path: {image.file_path}")
                    print(f"   Current public_url: {image.public_url}")
                    
                    # If public_url is missing or empty, generate and update it
                    if not image.public_url:
                        new_url = storage_service.get_public_url(image.file_path)
                        print(f"   Generated public_url: {new_url}")
                        
                        # Update the database
                        try:
                            update_result = supabase.table("harvest_images").update({
                                "public_url": new_url
                            }).eq("id", str(image.id)).execute()
                            
                            if update_result.data:
                                updated_count += 1
                                print(f"   ✅ Updated public_url in database")
                            else:
                                print(f"   ❌ Failed to update public_url - no data returned")
                        except Exception as e:
                            print(f"   ❌ Failed to update public_url: {e}")
                    else:
                        print(f"   ✅ Public URL already exists")
        
        print(f"🎉 Test completed! Updated {updated_count} image URLs")
        
        # Test a sample public URL
        if harvest_logs:
            for log in harvest_logs:
                if log.images:
                    sample_image = log.images[0]
                    print(f"🔗 Sample public URL: {sample_image.public_url}")
                    break
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_image_urls()) 