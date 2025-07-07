# Plant Journey App – Complete Feature Specification

A comprehensive specification for a **visual plant-journey application** that documents and celebrates every plant's complete lifecycle story through unified event logging.

---

## 🎯 Vision & Scope

Transform from harvest-only logging to a complete plant management system supporting:
- **Individual Plant Tracking**: Each plant has its own identity and lifecycle
- **Multiple Event Types**: Harvest, bloom, and growth snapshot events
- **Complete Journey Documentation**: From planting to harvest with visual timeline
- **Growth Analytics**: Track plant health, productivity, and seasonal patterns

---

## 🚀 Core Architecture – Unified Event System

### 1. Complete Database Schema

#### Primary Tables

| Table | Purpose | Core Fields |
|-------|---------|-------------|
| `plants` | Individual plant tracking | `id` UUID PK · `name` VARCHAR(100) · `variety_id` FK · `planted_date` DATE · `location` VARCHAR(200) · `status` ENUM · `notes` TEXT · `created_at` · `updated_at` |
| `plant_varieties` | Plant variety catalog | `id` UUID PK · `name` VARCHAR(100) UNIQUE · `category` VARCHAR(50) · `description` TEXT · `growing_season` VARCHAR(50) · `harvest_time_days` INT · `created_at` |
| `plant_events` | Unified event logging | `id` UUID PK · `user_id` FK · `plant_id` FK · `event_type` ENUM · `event_date` TIMESTAMP · `produce` VARCHAR(100) · `quantity` FLOAT · `unit` VARCHAR(50) · `flower_type` VARCHAR(100) · `bloom_stage` VARCHAR(50) · `description` TEXT · `notes` TEXT · `location` VARCHAR(200) · `metrics` JSONB · `created_at` · `updated_at` |
| `event_images` | Event photo management | `id` UUID PK · `event_id` FK · `filename` VARCHAR(255) · `original_filename` VARCHAR(255) · `file_path` VARCHAR(500) · `file_size` BIGINT · `mime_type` VARCHAR(100) · `width` INT · `height` INT · `upload_order` INT · `public_url` TEXT · `created_at` · `updated_at` |

#### Event Type Specifications

**Event Types ENUM**: `harvest` | `bloom` | `snapshot`

**Plant Status ENUM**: `active` | `harvested` | `deceased` | `dormant`

**Bloom Stage ENUM**: `bud` | `opening` | `full_bloom` | `fading` | `seed_set`

### 2. Event Type Field Mapping

#### Harvest Events
**Required Fields**: `event_type='harvest'`, `event_date`, `produce`, `quantity`, `unit`
**Optional Fields**: `description`, `notes`, `location`, photos
**Example**: 
```json
{
  "event_type": "harvest",
  "event_date": "2024-06-15T10:00:00Z",
  "produce": "Cherry Tomatoes",
  "quantity": 2.5,
  "unit": "pounds",
  "description": "First major harvest of the season",
  "notes": "Perfect ripeness, excellent flavor"
}
```

#### Bloom Events
**Required Fields**: `event_type='bloom'`, `event_date`, `flower_type`
**Optional Fields**: `bloom_stage`, `description`, `notes`, `location`, photos
**Metrics JSONB**: `{"bloom_count": 12, "color": "bright_yellow", "size_cm": 5}`
**Example**:
```json
{
  "event_type": "bloom",
  "event_date": "2024-05-20T14:30:00Z",
  "flower_type": "Sunflower",
  "bloom_stage": "full_bloom",
  "description": "First bloom of the season",
  "metrics": {"bloom_count": 1, "diameter_cm": 15, "color": "golden_yellow"}
}
```

#### Snapshot Events
**Required Fields**: `event_type='snapshot'`, `event_date`
**Optional Fields**: `description`, `notes`, `location`, photos
**Metrics JSONB**: `{"height_cm": 45, "width_cm": 30, "health_score": 8, "leaf_count": 24}`
**Example**:
```json
{
  "event_type": "snapshot",
  "event_date": "2024-06-01T09:00:00Z",
  "description": "Monthly growth check",
  "metrics": {
    "height_cm": 45,
    "width_cm": 30,
    "health_score": 8,
    "leaf_count": 24,
    "new_growth": true,
    "pest_issues": false
  }
}
```

### 3. Flexible Data Architecture

1. **Nullable Columns**: Event-specific fields (like `produce` for harvest or `flower_type` for bloom) are nullable and only populated when relevant
2. **JSONB Metrics**: Flexible nested data storage for measurements, observations, and custom tracking fields
3. **Application-Level Validation**: Dynamic Pydantic models validate data based on `event_type`
4. **Unified Queries**: Single table enables efficient timeline queries across all event types

## 🔧 API Architecture

### 1. Core Event Endpoints

| Method & Path | Purpose | Parameters |
|---------------|---------|------------|
| `POST /api/events` | Create new event | Body: event data with `event_type` |
| `GET /api/events` | List all events | `plant_id`, `event_type`, `date_from`, `date_to`, `limit`, `cursor` |
| `GET /api/events/{id}` | Get single event | Path: `event_id` |
| `PUT /api/events/{id}` | Update event | Path: `event_id`, Body: updated fields |
| `DELETE /api/events/{id}` | Delete event | Path: `event_id` |

### 2. Plant Management Endpoints

| Method & Path | Purpose | Parameters |
|---------------|---------|------------|
| `POST /api/plants` | Create new plant | Body: plant data with `variety_id` |
| `GET /api/plants` | List all plants | `status`, `variety_id`, `location` |
| `GET /api/plants/{id}` | Get plant details | Path: `plant_id` |
| `GET /api/plants/{id}/events` | Get plant timeline | Path: `plant_id`, `event_type`, `date_range` |
| `PUT /api/plants/{id}` | Update plant info | Path: `plant_id`, Body: updated fields |

### 3. Variety Management Endpoints

| Method & Path | Purpose | Parameters |
|---------------|---------|------------|
| `POST /api/varieties` | Create plant variety | Body: variety data |
| `GET /api/varieties` | List varieties | `category`, `search` |
| `GET /api/varieties/{id}` | Get variety details | Path: `variety_id` |

### 4. Backward Compatibility

| Method & Path | Purpose | Status |
|---------------|---------|--------|
| `GET /api/harvest-logs` | Legacy harvest endpoint | Maps to harvest events |
| `POST /api/harvest-logs` | Legacy harvest creation | Creates harvest event |
| `GET /api/harvest-logs/{id}` | Legacy single harvest | Maps to harvest event |

### 5. Dynamic Validation Strategy

```python
# Pydantic model selection based on event_type
def get_event_model(event_type: str):
    if event_type == "harvest":
        return HarvestEventCreate
    elif event_type == "bloom":
        return BloomEventCreate
    elif event_type == "snapshot":
        return SnapshotEventCreate
    else:
        raise ValueError(f"Unknown event type: {event_type}")

@router.post("/api/events")
async def create_event(request: Request):
    # Dynamic model validation
    body = await request.json()
    event_type = body.get("event_type")
    model_class = get_event_model(event_type)
    validated_data = model_class(**body)
    # Process event creation...
```

## 🎨 Frontend Architecture

### 1. Unified Event Logging Interface

#### Main Dashboard Flow
1. **Central Action Button**: Prominent "Log New Event" button on main dashboard
2. **Event Type Selection**: Modal with three visually distinct options:
   - 🌾 **Log Harvest** - Record crop yields and quantities
   - 🌸 **Record Bloom** - Track flowering stages and timing
   - 📸 **Plant Snapshot** - Document growth and health metrics
3. **Dynamic Form Rendering**: Form fields adapt based on selected event type
4. **Unified Submission**: Single API endpoint handles all event types

#### Event-Specific Form Components

**Harvest Form Fields**:
- Plant selection (dropdown from active plants)
- Produce type (text input with autocomplete)
- Quantity (number input)
- Unit (dropdown: pounds, kilograms, pieces, etc.)
- Harvest date/time (datetime picker)
- Location (optional text input)
- Notes (optional textarea)
- Photo upload (multiple images)

**Bloom Form Fields**:
- Plant selection (dropdown from active plants)
- Flower type (text input with autocomplete)
- Bloom stage (dropdown: bud, opening, full_bloom, fading, seed_set)
- Bloom date/time (datetime picker)
- Growth metrics (expandable section):
  - Bloom count (number)
  - Size/diameter (number + unit)
  - Color (color picker or text)
- Description (optional textarea)
- Photo upload (multiple images)

**Snapshot Form Fields**:
- Plant selection (dropdown from active plants)
- Snapshot date/time (datetime picker)
- Growth measurements (expandable metrics):
  - Height (number + unit)
  - Width/spread (number + unit)
  - Health score (1-10 slider)
  - Leaf count (optional number)
  - Custom metrics (key-value pairs)
- Observations (textarea)
- Health indicators (checkboxes: new growth, pest issues, disease signs)
- Photo upload (multiple images)

### 2. Enhanced Plant Management

#### Plant Profile Pages
- **Individual Plant Dashboard**: Timeline view of all events for a specific plant
- **Plant List View**: Grid or list of all plants with status indicators
- **Plant Creation Form**: Add new plants with variety selection and planting details

#### Variety Management
- **Variety Catalog**: Browse and manage plant varieties
- **Variety Details**: Growing information, typical harvest times, care instructions
- **Custom Varieties**: Add user-defined plant varieties

### 3. Advanced Gallery Features

#### Multi-Event Timeline View
- **Unified Timeline**: All events displayed chronologically
- **Event Type Filtering**: Toggle visibility of harvest, bloom, and snapshot events
- **Plant-Specific Views**: Filter timeline by individual plants
- **Seasonal Grouping**: Group events by growing seasons

#### Enhanced Analytics Dashboard
- **Harvest Productivity**: Yield tracking over time
- **Bloom Cycle Analysis**: Flowering patterns and timing
- **Growth Tracking**: Plant development metrics and trends
- **Comparative Analysis**: Compare performance across plants and varieties

### 4. Mobile-First Design Considerations

#### Quick Entry Modes
- **Voice Notes**: Audio recording for quick field observations
- **Quick Snap**: Rapid photo + basic info entry
- **Bulk Entry**: Multiple events for batch operations

#### Offline Capability
- **Draft Storage**: Save incomplete entries when offline
- **Sync Queue**: Queue events for upload when connection returns
- **Local Photo Storage**: Compress and store photos locally until sync

### 5. User Experience Enhancements

#### Smart Defaults
- **Location Memory**: Remember and suggest previous locations
- **Plant Context**: Pre-select plants based on recent activity
- **Seasonal Prompts**: Suggest appropriate events based on time of year

#### Data Validation
- **Real-time Validation**: Immediate feedback on form inputs
- **Smart Suggestions**: Autocomplete based on historical data
- **Photo Guidelines**: Visual guides for optimal plant photography

---

## 🚀 Implementation Strategy

### Phase 1: Foundation (Week 1-2)
**Database & Backend Core**
- [ ] Create new database schema with plant_events table
- [ ] Implement plant and variety management tables
- [ ] Create data migration scripts from harvest_logs
- [ ] Build new Pydantic models for event types
- [ ] Implement dynamic validation system

### Phase 2: API Development (Week 2-3)
**Unified Event System**
- [ ] Create `/api/events` router with CRUD operations
- [ ] Implement plant management endpoints
- [ ] Add variety management endpoints
- [ ] Maintain backward compatibility with existing endpoints
- [ ] Add comprehensive error handling and logging

### Phase 3: Frontend Transformation (Week 3-4)
**User Interface Updates**
- [ ] Build unified event logging modal
- [ ] Create dynamic form components for each event type
- [ ] Update gallery to support multiple event types
- [ ] Implement plant management interface
- [ ] Add variety catalog and management

### Phase 4: Enhanced Features (Week 4-5)
**Advanced Capabilities**
- [ ] Implement plant timeline views
- [ ] Add advanced analytics and reporting
- [ ] Create mobile-optimized interfaces
- [ ] Add offline capability and sync
- [ ] Implement smart defaults and suggestions

### Phase 5: Migration & Testing (Week 5-6)
**Data Migration & Validation**
- [ ] Execute production data migration
- [ ] Comprehensive testing of all features
- [ ] Performance optimization and monitoring
- [ ] User acceptance testing
- [ ] Documentation and training materials

---

## 🎯 Success Metrics

### Technical Metrics
- **Data Integrity**: 100% successful migration of existing harvest data
- **Performance**: API response times ≤ current benchmarks
- **Compatibility**: All existing functionality preserved during transition
- **Test Coverage**: ≥ 90% test coverage for new features

### User Experience Metrics
- **Feature Adoption**: Users actively logging bloom and snapshot events
- **Engagement**: Increased frequency of plant tracking activities
- **Satisfaction**: Positive feedback on unified logging interface
- **Data Quality**: Improved consistency in event logging

### Business Metrics
- **Feature Utilization**: All three event types being used regularly
- **Data Richness**: Increased metadata and metrics per plant
- **User Retention**: Maintained or improved user engagement
- **System Reliability**: 99.9% uptime during migration period

---

## 🔄 Migration Considerations

### Data Preservation
- **Complete Backup**: Full database backup before migration
- **Incremental Migration**: Gradual data transformation with validation
- **Rollback Plan**: Ability to revert to previous system if needed
- **Data Validation**: Comprehensive checks for data integrity

### User Experience
- **Gradual Rollout**: Phase introduction of new features
- **Training Materials**: Documentation and guides for new features
- **Support Plan**: Dedicated support during transition period
- **Feedback Loop**: Continuous user feedback collection and response

### System Performance
- **Load Testing**: Validate performance under expected usage
- **Monitoring**: Enhanced monitoring during migration period
- **Optimization**: Database query optimization for new schema
- **Scaling Plan**: Prepared for increased data volume and complexity

This comprehensive specification provides the foundation for transforming the harvest-only application into a complete plant journey tracking system while maintaining all existing functionality and ensuring a smooth user transition.
