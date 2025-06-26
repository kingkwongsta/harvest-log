'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { harvestLogsApi, imagesApi, ApiError } from '@/lib/api'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const clearLogs = () => {
    setLogs([])
    console.clear()
  }

  const testApiConnectivity = async () => {
    setIsRunning(true)
    addLog('🚀 Starting API connectivity test...')

    try {
      // Test 1: Health check
      addLog('1️⃣ Testing health check...')
      const response = await fetch('http://localhost:8000/')
      if (response.ok) {
        addLog('✅ Health check passed')
      } else {
        addLog(`❌ Health check failed: ${response.status} ${response.statusText}`)
      }

      // Test 2: Get harvest stats
      addLog('2️⃣ Testing harvest stats API...')
      try {
        const stats = await harvestLogsApi.getStats()
        addLog(`✅ Stats API success: ${JSON.stringify(stats)}`)
      } catch (error) {
        addLog(`❌ Stats API failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 3: Create test harvest
      addLog('3️⃣ Testing harvest creation...')
      try {
        const harvestData = {
          crop_name: 'Debug Test Lettuce',
          quantity: 1,
          unit: 'head',
          harvest_date: new Date().toISOString(),
          notes: 'Created from debug page'
        }

        const harvestResult = await harvestLogsApi.create(harvestData)
        if (harvestResult.success && harvestResult.data) {
          const harvestId = harvestResult.data.id
          addLog(`✅ Harvest created successfully: ${harvestId}`)

          // Test 4: Image upload with minimal file
          addLog('4️⃣ Testing image upload...')
          try {
            // Create a minimal test image file
            const canvas = document.createElement('canvas')
            canvas.width = 100
            canvas.height = 100
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#22c55e'
              ctx.fillRect(0, 0, 100, 100)
              ctx.fillStyle = 'white'
              ctx.font = '16px Arial'
              ctx.fillText('TEST', 30, 55)
            }

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!)
              }, 'image/png')
            })

            const testFile = new File([blob], 'debug-test.png', { type: 'image/png' })
            addLog(`📎 Created test file: ${testFile.name} (${testFile.size} bytes)`)

            const imageResult = await imagesApi.uploadMultiple(harvestId, [testFile])
            addLog(`✅ Image upload result: ${JSON.stringify(imageResult)}`)

            if (imageResult.success) {
              addLog('✅ All tests passed! 🎉')
            } else {
              addLog(`⚠️ Image upload returned success=false: ${imageResult.message}`)
            }

          } catch (imageError) {
            addLog(`❌ Image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`)
            if (imageError instanceof ApiError) {
              addLog(`🔍 API Error details: Status=${imageError.status}`)
            }
          }

        } else {
          addLog(`❌ Harvest creation failed: ${harvestResult.message}`)
        }
      } catch (harvestError) {
        addLog(`❌ Harvest creation failed: ${harvestError instanceof Error ? harvestError.message : 'Unknown error'}`)
      }

    } catch (error) {
      addLog(`💥 Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
      addLog('🏁 Test suite completed.')
    }
  }

  const testFileUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      setIsRunning(true)
      addLog(`📁 Selected ${files.length} file(s) for upload test`)

      try {
        // First create a test harvest
        const harvestData = {
          crop_name: 'File Upload Test',
          quantity: 1,
          unit: 'test',
          harvest_date: new Date().toISOString(),
          notes: 'File upload test from debug page'
        }

        const harvestResult = await harvestLogsApi.create(harvestData)
        if (harvestResult.success && harvestResult.data) {
          const harvestId = harvestResult.data.id
          addLog(`✅ Test harvest created: ${harvestId}`)

          // Upload the selected files
          const imageResult = await imagesApi.uploadMultiple(harvestId, files)
          addLog(`📤 Upload completed: ${JSON.stringify(imageResult)}`)

        } else {
          addLog(`❌ Failed to create test harvest: ${harvestResult.message}`)
        }
      } catch (error) {
        addLog(`❌ File upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsRunning(false)
      }
    }

    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 API Debug & Testing Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={testApiConnectivity}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? 'Running Tests...' : '🧪 Run Full Test Suite'}
              </Button>

              <Button
                onClick={testFileUpload}
                disabled={isRunning}
                variant="outline"
              >
                📁 Test File Upload
              </Button>

              <Button
                onClick={clearLogs}
                variant="outline"
              >
                🗑️ Clear Logs
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-black text-green-400 font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">
                  Click "Run Full Test Suite" to start debugging...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Full Test Suite:</strong> Tests API connectivity, harvest creation, and image upload with a generated test image.</p>
            <p><strong>File Upload Test:</strong> Lets you select real files from your computer to test the upload process.</p>
            <p><strong>Check Console:</strong> Open browser DevTools (F12) → Console tab for detailed API logs.</p>
            <p><strong>Backend Status:</strong> Make sure FastAPI is running on http://localhost:8000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 