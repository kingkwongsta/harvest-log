#!/usr/bin/env python3
"""
Comprehensive test script for Image Upload API endpoints
Tests all endpoints: upload single, upload multiple, get images, delete image
"""

import asyncio
import requests
import io
from PIL import Image
from typing import List, Dict, Any
import uuid
import time


class ImageUploadAPITester:
    """Test class for Image Upload API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_harvest_log_id = str(uuid.uuid4())
        
    def create_test_image(self, color: str = 'red', size: tuple = (100, 100)) -> bytes:
        """Create a test image and return as bytes"""
        image = Image.new('RGB', size, color=color)
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        return img_buffer.getvalue()
    
    def create_harvest_log(self) -> str:
        """Create a test harvest log and return its ID"""
        harvest_data = {
            "crop_name": "Test Tomatoes",
            "quantity": 2.5,
            "unit": "lbs",
            "harvest_date": "2024-01-15",
            "location": "Garden Bed 1",
            "notes": "Test harvest for API testing"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/harvest-logs/", 
                json=harvest_data
            )
            
            if response.status_code == 201:
                harvest_id = response.json()["id"]
                print(f"✅ Created test harvest log: {harvest_id}")
                return harvest_id
            else:
                print(f"❌ Failed to create harvest log: {response.status_code} - {response.text}")
                return self.test_harvest_log_id  # fallback to UUID
                
        except Exception as e:
            print(f"❌ Error creating harvest log: {e}")
            return self.test_harvest_log_id  # fallback to UUID
    
    def test_server_health(self) -> bool:
        """Test if the API server is running"""
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("✅ API server is running")
                return True
            else:
                print(f"❌ API server responded with status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to API server: {e}")
            return False
    
    def test_single_image_upload(self, harvest_log_id: str) -> Dict[str, Any]:
        """Test single image upload endpoint"""
        print(f"\n📤 Testing single image upload to harvest log: {harvest_log_id}")
        
        # Create test image
        image_data = self.create_test_image('blue', (150, 100))
        
        # Prepare multipart form data
        files = {
            'file': ('test_single.jpg', image_data, 'image/jpeg')
        }
        data = {
            'upload_order': 1
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/images/upload/{harvest_log_id}",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['success']:
                    print(f"✅ Single upload successful: {result['message']}")
                    print(f"   Image ID: {result['data']['id']}")
                    print(f"   File path: {result['data']['file_path']}")
                    return result['data']
                else:
                    print(f"❌ Upload failed: {result['message']}")
                    return {}
            else:
                print(f"❌ Upload failed with status {response.status_code}: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Single upload error: {e}")
            return {}
    
    def test_multiple_image_upload(self, harvest_log_id: str) -> List[Dict[str, Any]]:
        """Test multiple image upload endpoint"""
        print(f"\n📤📤 Testing multiple image upload to harvest log: {harvest_log_id}")
        
        # Create multiple test images
        image1 = self.create_test_image('green', (120, 80))
        image2 = self.create_test_image('yellow', (100, 120))
        image3 = self.create_test_image('purple', (80, 80))
        
        # Prepare multipart form data
        files = [
            ('files', ('test_multi_1.jpg', image1, 'image/jpeg')),
            ('files', ('test_multi_2.jpg', image2, 'image/jpeg')),
            ('files', ('test_multi_3.jpg', image3, 'image/jpeg'))
        ]
        
        try:
            response = requests.post(
                f"{self.base_url}/api/images/upload-multiple/{harvest_log_id}",
                files=files
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['success']:
                    print(f"✅ Multiple upload successful: {result['message']}")
                    print(f"   Uploaded {len(result['data'])} images")
                    for img in result['data']:
                        print(f"   - {img['original_filename']} -> {img['filename']}")
                    return result['data']
                else:
                    print(f"❌ Multiple upload failed: {result['message']}")
                    return []
            else:
                print(f"❌ Multiple upload failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Multiple upload error: {e}")
            return []
    
    def test_get_harvest_images(self, harvest_log_id: str) -> List[Dict[str, Any]]:
        """Test get harvest images endpoint"""
        print(f"\n📋 Testing get harvest images for: {harvest_log_id}")
        
        try:
            response = requests.get(f"{self.base_url}/api/images/harvest/{harvest_log_id}")
            
            if response.status_code == 200:
                images = response.json()
                print(f"✅ Retrieved {len(images)} images for harvest log")
                for img in images:
                    print(f"   - {img['original_filename']} ({img['file_size']} bytes)")
                return images
            else:
                print(f"❌ Get images failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Get images error: {e}")
            return []
    
    def test_delete_image(self, image_id: str) -> bool:
        """Test delete image endpoint"""
        print(f"\n🗑️  Testing delete image: {image_id}")
        
        try:
            response = requests.delete(f"{self.base_url}/api/images/{image_id}")
            
            if response.status_code == 200:
                result = response.json()
                if result['success']:
                    print(f"✅ Image deleted successfully: {result['message']}")
                    return True
                else:
                    print(f"❌ Delete failed: {result['message']}")
                    return False
            else:
                print(f"❌ Delete failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Delete error: {e}")
            return False
    
    def run_full_test_suite(self):
        """Run the complete test suite"""
        print("🚀 Starting Image Upload API Test Suite\n")
        
        # Check if server is running
        if not self.test_server_health():
            print("\n❌ Cannot proceed - API server is not accessible")
            return
        
        # Create a test harvest log
        harvest_log_id = self.create_harvest_log()
        
        # Wait a moment for the harvest log to be created
        time.sleep(1)
        
        # Test single image upload
        single_upload_result = self.test_single_image_upload(harvest_log_id)
        
        # Test multiple image upload
        multiple_upload_results = self.test_multiple_image_upload(harvest_log_id)
        
        # Test getting harvest images
        all_images = self.test_get_harvest_images(harvest_log_id)
        
        # Test deleting one image (if we have any)
        if all_images:
            test_image_id = all_images[0]['id']
            self.test_delete_image(test_image_id)
            
            # Verify deletion worked
            remaining_images = self.test_get_harvest_images(harvest_log_id)
            if len(remaining_images) == len(all_images) - 1:
                print("✅ Image deletion verified - count reduced by 1")
            else:
                print("❌ Image deletion verification failed")
        
        print(f"\n✨ Test suite completed!")
        print(f"🧪 Test harvest log ID: {harvest_log_id}")
        print(f"📊 Summary:")
        print(f"   - Single upload: {'✅ Passed' if single_upload_result else '❌ Failed'}")
        print(f"   - Multiple upload: {'✅ Passed' if multiple_upload_results else '❌ Failed'}")
        print(f"   - Get images: {'✅ Passed' if all_images else '❌ Failed'}")


if __name__ == "__main__":
    tester = ImageUploadAPITester()
    tester.run_full_test_suite() 