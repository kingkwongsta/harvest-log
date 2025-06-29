# Plant Journey Migration Plan

A comprehensive plan to migrate from a harvest-only logging application to a complete plant journey tracking system supporting multiple event types: harvest, bloom, and snapshot events.

## Current State Analysis

### Existing Architecture
- **Database**: Single-purpose `harvest_logs` and `harvest_images` tables
- **Backend**: FastAPI with harvest-specific models and `/api/harvest-logs` endpoints
- **Frontend**: Next.js with harvest-focused UI components
- **Features**: Harvest logging, image management, gallery with 4 viewing modes

### Limitations of Current System
- Only supports harvest events
- Cannot track plant growth journey over time
- No plant lifecycle management
- Limited to quantity-based measurements

## Target Architecture

### Unified Event System
- **Core Concept**: Single `plant_events` table supporting multiple event types
- **Event Types**: 
  - Harvest (quantity, produce, harvest_date)
  - Bloom (flower_type, bloom_stage, bloom_date)
  - Snapshot (growth metrics, health observations)
- **Flexible Data**: JSONB metrics field for extensible data storage

### Enhanced Plant Management
- **Plant Tracking**: Individual plant identification and lifecycle management
- **Variety Management**: Plant varieties with characteristics and growing information
- **Location Tracking**: Precise location information for each plant/event

## Migration Strategy

### Phase 1: Database Schema Migration

#### New Tables Structure

```sql
-- Core plant information
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    variety_id UUID REFERENCES plant_varieties(id),
    planted_date DATE,
    location VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active', -- active, harvested, deceased
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plant varieties catalog
CREATE TABLE plant_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- vegetable, fruit, flower, herb
    description TEXT,
    growing_season VARCHAR(50),
    harvest_time_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unified event logging
CREATE TABLE plant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- For future multi-user support
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('harvest', 'bloom', 'snapshot')),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Harvest-specific fields
    produce VARCHAR(100),
    quantity FLOAT,
    unit VARCHAR(50),
    
    -- Bloom-specific fields
    flower_type VARCHAR(100),
    bloom_stage VARCHAR(50), -- bud, opening, full_bloom, fading
    
    -- Snapshot-specific fields (stored in metrics as well)
    -- Common fields
    description TEXT,
    notes TEXT,
    location VARCHAR(200),
    
    -- Flexible metrics storage (JSONB)
    metrics JSONB, -- height, width, health_score, color, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated images table to support all event types
CREATE TABLE event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES plant_events(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    upload_order INTEGER DEFAULT 0,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Data Migration Script

```sql
-- Step 1: Create plant varieties from existing harvest data
INSERT INTO plant_varieties (name, category)
SELECT DISTINCT 
    crop_name,
    CASE 
        WHEN crop_name ILIKE '%tomato%' OR crop_name ILIKE '%pepper%' THEN 'vegetable'
        WHEN crop_name ILIKE '%apple%' OR crop_name ILIKE '%berry%' THEN 'fruit'
        WHEN crop_name ILIKE '%basil%' OR crop_name ILIKE '%mint%' THEN 'herb'
        ELSE 'vegetable'
    END as category
FROM harvest_logs
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create plants from harvest data
INSERT INTO plants (name, variety_id, planted_date, location, status)
SELECT DISTINCT
    hl.crop_name || ' Plant',
    pv.id,
    MIN(hl.harvest_date) - INTERVAL '90 days', -- Estimate planting date
    hl.location,
    'active'
FROM harvest_logs hl
JOIN plant_varieties pv ON pv.name = hl.crop_name
GROUP BY hl.crop_name, pv.id, hl.location;

-- Step 3: Migrate harvest logs to plant events
INSERT INTO plant_events (
    plant_id, event_type, event_date, produce, quantity, unit, 
    description, notes, location, created_at, updated_at
)
SELECT 
    p.id as plant_id,
    'harvest' as event_type,
    hl.harvest_date,
    hl.crop_name,
    hl.quantity,
    hl.unit,
    CONCAT('Harvested ', hl.quantity, ' ', hl.unit, ' of ', hl.crop_name),
    hl.notes,
    hl.location,
    hl.created_at,
    hl.updated_at
FROM harvest_logs hl
JOIN plant_varieties pv ON pv.name = hl.crop_name
JOIN plants p ON p.variety_id = pv.id;

-- Step 4: Migrate harvest images to event images
INSERT INTO event_images (
    event_id, filename, original_filename, file_path, file_size,
    mime_type, width, height, upload_order, public_url, created_at, updated_at
)
SELECT 
    pe.id as event_id,
    hi.filename,
    hi.original_filename,
    hi.file_path,
    hi.file_size,
    hi.mime_type,
    hi.width,
    hi.height,
    hi.upload_order,
    hi.public_url,
    hi.created_at,
    hi.updated_at
FROM harvest_images hi
JOIN harvest_logs hl ON hi.harvest_log_id = hl.id
JOIN plant_events pe ON pe.event_date = hl.harvest_date 
    AND pe.quantity = hl.quantity 
    AND pe.event_type = 'harvest';
```

### Phase 2: Backend API Updates

#### New Pydantic Models

```python
from enum import Enum
from typing import Union, Optional, Dict, Any

class EventType(str, Enum):
    HARVEST = "harvest"
    BLOOM = "bloom"
    SNAPSHOT = "snapshot"

# Base event model
class PlantEventBase(BaseModel):
    plant_id: Optional[UUID] = None
    event_type: EventType
    event_date: datetime
    description: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None

# Event-specific models
class HarvestEventData(BaseModel):
    produce: str
    quantity: float
    unit: str

class BloomEventData(BaseModel):
    flower_type: str
    bloom_stage: str = "full_bloom"

class SnapshotEventData(BaseModel):
    metrics: Dict[str, Any]  # height, width, health_score, etc.

# Union model for dynamic validation
PlantEventCreate = Union[
    PlantEventBase & HarvestEventData,
    PlantEventBase & BloomEventData,
    PlantEventBase & SnapshotEventData
]
```

#### New API Endpoints

```python
# /api/events router
@router.post("/", response_model=PlantEventResponse)
async def create_plant_event(event_data: PlantEventCreate):
    """Create a new plant event (harvest, bloom, or snapshot)"""
    pass

@router.get("/", response_model=PlantEventListResponse)
async def get_plant_events(
    event_type: Optional[EventType] = None,
    plant_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get plant events with filtering"""
    pass

# Backward compatibility
@router.get("/harvest-logs", response_model=HarvestLogListResponse)
async def get_harvest_logs_compat():
    """Compatibility endpoint for existing harvest logs"""
    # Return only harvest events in old format
    pass
```

### Phase 3: Frontend UI Updates

#### Unified Event Logging Interface

```typescript
// New event creation modal
interface EventCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated: (event: PlantEvent) => void;
}

// Event type selection
const EventTypeSelector = () => {
    const [selectedType, setSelectedType] = useState<EventType>('harvest');
    
    return (
        <div className="event-type-selector">
            <button onClick={() => setSelectedType('harvest')}>
                🌾 Log Harvest
            </button>
            <button onClick={() => setSelectedType('bloom')}>
                🌸 Record Bloom
            </button>
            <button onClick={() => setSelectedType('snapshot')}>
                📸 Plant Snapshot
            </button>
        </div>
    );
};

// Dynamic form components
const HarvestForm = ({ onSubmit }: { onSubmit: (data: HarvestEventData) => void }) => {
    // Existing harvest form logic
};

const BloomForm = ({ onSubmit }: { onSubmit: (data: BloomEventData) => void }) => {
    // New bloom tracking form
};

const SnapshotForm = ({ onSubmit }: { onSubmit: (data: SnapshotEventData) => void }) => {
    // New growth tracking form
};
```

#### Enhanced Gallery Views

- **Timeline Journey**: Show complete plant lifecycle with all event types
- **Event Filtering**: Filter by harvest, bloom, or snapshot events
- **Plant-Centric View**: Group events by individual plants
- **Analytics Dashboard**: Growth trends, harvest yields, bloom cycles

### Phase 4: Data Migration Execution

#### Migration Script Steps

1. **Backup Creation**: Full database backup before migration
2. **Schema Creation**: Execute new table creation scripts
3. **Data Migration**: Run data migration scripts with validation
4. **Image Migration**: Update image references and file paths
5. **Index Creation**: Add performance indexes for new tables
6. **Validation**: Verify data integrity and completeness

#### Rollback Plan

1. **Schema Rollback**: Drop new tables if migration fails
2. **Data Restoration**: Restore from backup if needed
3. **API Rollback**: Revert to harvest-only endpoints
4. **Frontend Rollback**: Revert UI to harvest-only interface

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Create new database schema
- [ ] Implement data migration scripts
- [ ] Update backend models and validation
- [ ] Create new API endpoints
- [ ] Maintain backward compatibility

### Week 2: Frontend Updates
- [ ] Create unified event logging interface
- [ ] Update gallery components for multiple event types
- [ ] Implement dynamic form validation
- [ ] Add plant management features

### Week 3: Testing & Migration
- [ ] Execute data migration with validation
- [ ] Comprehensive testing of all features
- [ ] Performance optimization
- [ ] Documentation updates

### Week 4: Deployment & Cleanup
- [ ] Production deployment
- [ ] Monitor system performance
- [ ] User acceptance testing
- [ ] Remove deprecated code and endpoints

## Success Metrics

- **Data Integrity**: 100% of existing harvest data successfully migrated
- **Feature Parity**: All existing functionality preserved
- **New Capabilities**: Support for bloom and snapshot events
- **Performance**: API response times within existing benchmarks
- **User Experience**: Intuitive event type selection and logging

## Risk Mitigation

- **Data Loss**: Comprehensive backup and rollback procedures
- **Performance Impact**: Staged migration with monitoring
- **User Disruption**: Backward compatibility during transition
- **Bug Introduction**: Extensive testing and gradual feature rollout

This migration plan transforms the harvest-only application into a comprehensive plant journey tracking system while preserving all existing functionality and data.