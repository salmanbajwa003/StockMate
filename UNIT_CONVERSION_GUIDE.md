# Unit Conversion System

## Overview

The warehouse management system uses **yard** as the standard unit for all products on the backend. When users create or update products with different units (kg, meter, etc.), the system automatically converts them to yards for consistent storage.

## Standard Unit

**Backend Standard Unit:** `yard`

All product weights are stored in yards regardless of the input unit. This ensures:

- Consistent data storage
- Easy calculations and comparisons
- Simplified inventory management
- No unit confusion

## Supported Units

### Length Units

| Unit         | Conversion to Yard      | Example               |
| ------------ | ----------------------- | --------------------- |
| `yard`       | 1.0 (no conversion)     | 5 yards = 5 yards     |
| `meter`      | 1 meter = 1.09361 yards | 5 meters = 5.47 yards |
| `foot`       | 1 foot = 0.333333 yards | 9 feet = 3 yards      |
| `inch`       | 1 inch = 0.027778 yards | 36 inches = 1 yard    |
| `centimeter` | 1 cm = 0.0109361 yards  | 100 cm = 1.09 yards   |

### Weight Units (Approximation)

For fabric weight conversion (based on average fabric density):

| Unit    | Conversion to Yard  | Note                                       |
| ------- | ------------------- | ------------------------------------------ |
| `kg`    | 1 kg ≈ 1.64 yards   | Based on avg fabric (200 GSM, 1.5yd width) |
| `gram`  | 1 g ≈ 0.00164 yards | Same basis as kg                           |
| `pound` | 1 lb ≈ 0.744 yards  | Same basis as kg                           |

**Note:** Weight-to-length conversions are approximations based on:

- Average fabric weight: 200 GSM (grams per square meter)
- Standard fabric width: 1.5 yards
- Actual conversion may vary by fabric type

### Piece Units (No Conversion)

| Unit    | Handling                    |
| ------- | --------------------------- |
| `piece` | Stored as-is, no conversion |
| `roll`  | Stored as-is, no conversion |

## How It Works

### Creating a Product

**Example 1: User enters in kg**

```bash
POST /api/products
{
  "name": "Cotton Fabric",
  "weight": 5,
  "unit": "kg",
  "price": 25.00
}
```

**Backend stores as:**

```json
{
  "name": "Cotton Fabric",
  "weight": 8.2,
  "unit": "yard",
  "price": 25.0
}
```

Conversion: `5 kg × 1.64 = 8.2 yards`

**Example 2: User enters in meters**

```bash
POST /api/products
{
  "name": "Silk Fabric",
  "weight": 10,
  "unit": "meter",
  "price": 50.00
}
```

**Backend stores as:**

```json
{
  "name": "Silk Fabric",
  "weight": 10.936,
  "unit": "yard",
  "price": 50.0
}
```

Conversion: `10 meters × 1.09361 = 10.936 yards`

**Example 3: User enters in yards (no conversion)**

```bash
POST /api/products
{
  "name": "Khadar Fabric",
  "weight": 15,
  "unit": "yard",
  "price": 30.00
}
```

**Backend stores as:**

```json
{
  "name": "Khadar Fabric",
  "weight": 15,
  "unit": "yard",
  "price": 30.0
}
```

No conversion needed!

## API Behavior

### Creating Products

```typescript
// Input: Any supported unit
POST /api/products
{
  "weight": 5,
  "unit": "kg"  // or "meter", "foot", etc.
}

// Output: Always stored as yards
{
  "weight": 8.2,
  "unit": "yard"
}
```

### Updating Products

```typescript
// Update with different unit
PATCH /api/products/:id
{
  "weight": 3,
  "unit": "meter"
}

// Stored as yards
{
  "weight": 3.281,
  "unit": "yard"
}
```

### Retrieving Products

```typescript
// All products returned in yards
GET /
  api /
  products[
    // Response:
    {
      id: 'uuid',
      name: 'Cotton Fabric',
      weight: 8.2,
      unit: 'yard', // Always yard
    }
  ];
```

## Conversion Logs

The system logs all conversions for tracking:

```
Unit conversion: 5 kg → 8.2 yard
Unit conversion: 10 meter → 10.936 yard
Unit conversion: 36 inch → 1.0 yard
```

You can see these logs in the server console when creating/updating products with unit conversion.

## Code Implementation

### Unit Converter Utility

Location: `src/common/utils/unit-converter.ts`

```typescript
import { convertToStandardUnit } from '../common/utils/unit-converter';

// Convert any unit to yard
const result = convertToStandardUnit(5, 'kg');
// result = { value: 8.2, unit: 'yard', conversionApplied: true }
```

### Service Integration

The conversion happens automatically in `ProductsService`:

```typescript
// In create/update methods
if (weight !== undefined && unit) {
  const conversion = convertToStandardUnit(weight, unit);
  product.weight = conversion.value; // Converted value
  product.unit = conversion.unit; // Always 'yard'
}
```

## Advantages

### ✅ Consistency

- All products stored in the same unit
- No confusion about units
- Easy comparisons

### ✅ Automatic Conversion

- Users can input in any supported unit
- Backend handles conversion automatically
- No manual calculations needed

### ✅ Flexible Input

- Support for length units (meter, foot, inch)
- Support for weight units (kg, gram, pound)
- Support for piece units (piece, roll)

### ✅ Accurate Storage

- Conversions rounded to 3 decimal places
- Original values preserved in conversion logs
- Precise calculations

## Important Notes

### ⚠️ Weight Conversion Approximation

Weight-to-length conversions (kg, gram, pound) are **approximations** based on average fabric characteristics:

- Fabric weight: 200 GSM
- Fabric width: 1.5 yards
- Results may vary for different fabric types

For precise conversions, consider:

1. Using length units directly when possible
2. Adjusting conversion factors per fabric type
3. Storing both weight and length if needed

### ⚠️ Frontend Display

While backend stores in yards, frontend can:

- Display in user's preferred unit
- Convert on-the-fly for display
- Use the conversion utility for both directions

Example:

```typescript
// Frontend: Show in meters
import { convertFromStandardUnit } from 'unit-converter';

const displayValue = convertFromStandardUnit(10.936, 'meter');
// displayValue = { value: 10, unit: 'meter' }
```

## Examples by Use Case

### Textile Shop (Mixed Units)

**Scenario:** Shop receives fabrics in different units from suppliers

```bash
# Supplier A sends in kg
POST /api/products { "weight": 5, "unit": "kg" }
→ Stored as: 8.2 yards

# Supplier B sends in meters
POST /api/products { "weight": 10, "unit": "meter" }
→ Stored as: 10.936 yards

# Supplier C sends in yards
POST /api/products { "weight": 15, "unit": "yard" }
→ Stored as: 15 yards
```

All products now comparable and consistent!

### International Orders

**Scenario:** Customers from different countries

```bash
# US customer (yards)
POST /api/products { "weight": 5, "unit": "yard" }

# European customer (meters)
POST /api/products { "weight": 5, "unit": "meter" }

# UK customer (feet)
POST /api/products { "weight": 15, "unit": "foot" }
```

All stored consistently in yards for inventory management.

## API Testing

### Test Conversion

```bash
# Test kg to yard
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Fabric",
    "weight": 5,
    "unit": "kg",
    "price": 25.00
  }'

# Check response - weight should be in yards
# Expected: weight ≈ 8.2, unit: "yard"
```

### Verify Storage

```bash
# Get product
curl http://localhost:3000/api/products/:id

# Response shows:
{
  "weight": 8.2,
  "unit": "yard"  // Always yard
}
```

## Customization

To adjust conversion factors:

1. Edit `src/common/utils/unit-converter.ts`
2. Modify `LENGTH_TO_YARD` or `WEIGHT_TO_YARD` constants
3. Add new units as needed

Example:

```typescript
const LENGTH_TO_YARD: Record<string, number> = {
  [UnitType.YARD]: 1,
  [UnitType.METER]: 1.09361,
  // Add custom unit
  custom_unit: 0.5, // Your conversion factor
};
```

## Future Enhancements

- [ ] Add support for more units
- [ ] Fabric-specific conversion factors
- [ ] Conversion history tracking
- [ ] Unit preference per user
- [ ] Bidirectional conversion API
- [ ] Unit validation endpoint

---

**Summary:** The system automatically converts all product units to yards on the backend, ensuring consistency while allowing users to input in their preferred units. This eliminates confusion and simplifies inventory management.
