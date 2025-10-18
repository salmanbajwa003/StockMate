# Inventory Unit Handling

## Overview

The inventory system is fully integrated with the unit conversion system, ensuring all inventory quantities are stored and managed in **yards** (the standard backend unit).

## Key Principle

**Everything in Yards** 🎯

- Product weight → stored in yards
- Inventory quantity → stored in yards
- Inventory adjustments → converted to yards
- Invoice deductions → executed in yards

## Inventory Entity

The inventory table now includes a `unit` field that is always set to `yard`:

```typescript
@Entity('inventory')
export class Inventory {
  quantity: number; // Decimal (10,3) - always in yards
  unit: string; // Always 'yard'
  minimumQuantity: number; // In yards
  maximumQuantity: number; // In yards
  // ... other fields
}
```

### Data Types

- **quantity**: `decimal(10,3)` - Allows fractional yards (e.g., 8.254 yards)
- **unit**: `varchar(20)` - Always set to 'yard'
- All min/max quantities also in yards

## Operations

### 1. Adding Inventory

When you add inventory, you can specify any unit, and it will be converted to yards:

```bash
# Add 5 kg of fabric
POST /api/inventory
{
  "warehouseId": "warehouse-uuid",
  "productId": "product-uuid",
  "quantity": 5,
  "unit": "kg"
}

# Backend stores as:
{
  "quantity": 8.2,     # Converted from 5 kg
  "unit": "yard"       # Standard unit
}

# Console log:
# Inventory unit conversion: 5 kg → 8.2 yard
# Inventory created: Cotton Fabric in Warehouse A - 8.2 yards
```

**Auto-Increment Example:**

```bash
# First time: Add 5 kg (= 8.2 yards)
POST /api/inventory { "quantity": 5, "unit": "kg" }
→ Stored: 8.2 yards

# Second time: Add 3 meters (= 3.28 yards)
POST /api/inventory { "quantity": 3, "unit": "meter" }
→ Stored: 11.48 yards (8.2 + 3.28)

# Console log:
# Inventory unit conversion: 3 meter → 3.281 yard
# Inventory incremented: Cotton Fabric in Warehouse A - Added 3.281 yards, Total: 11.481 yards
```

### 2. Adjusting Inventory

Manual adjustments also support unit conversion:

```bash
# Add 2 meters to existing inventory
POST /api/inventory/:id/adjust
{
  "adjustment": 2,
  "unit": "meter",
  "reason": "Restocking"
}

# Backend converts and adds:
# - Converts 2 meters → 2.187 yards
# - Adds 2.187 to existing quantity

# Console log:
# Adjustment unit conversion: 2 meter → 2.187 yard
# Inventory adjusted: Cotton Fabric - +2.187 yards (Restocking), New total: 13.668 yards
```

**Negative Adjustments (Removal):**

```bash
# Remove 1 kg from inventory
POST /api/inventory/:id/adjust
{
  "adjustment": -1,
  "unit": "kg",
  "reason": "Damaged goods"
}

# Backend converts and subtracts:
# - Converts 1 kg → 1.64 yards
# - Subtracts 1.64 from existing quantity

# Console log:
# Adjustment unit conversion: -1 kg → -1.64 yard
# Inventory adjusted: Cotton Fabric - -1.64 yards (Damaged goods), New total: 12.028 yards
```

### 3. Invoice Deductions

When an invoice is created, inventory is automatically deducted **in yards**:

```bash
# Customer buys 3 yards
POST /api/invoices
{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 3,  # This is in yards
      "unitPrice": 25.00
    }
  ]
}

# Backend deducts 3 yards from inventory
# Current: 12.028 yards → After: 9.028 yards

# Console log:
# Invoice deduction: Cotton Fabric - Deducted 3 yards for invoice INV-2025-001
# Inventory adjusted: Cotton Fabric - -3 yards (Invoice INV-2025-001), New total: 9.028 yards
```

## Workflow Example

### Complete Scenario: From Product Creation to Sale

```bash
# Step 1: Create product (5 kg of fabric)
POST /api/products
{
  "name": "Cotton Fabric",
  "weight": 5,
  "unit": "kg",
  "price": 25.00
}
→ Stored as: weight: 8.2 yards

# Step 2: Add to inventory (10 meters)
POST /api/inventory
{
  "productId": "product-uuid",
  "warehouseId": "warehouse-uuid",
  "quantity": 10,
  "unit": "meter"
}
→ Stored as: quantity: 10.936 yards

# Step 3: Add more inventory (5 kg)
POST /api/inventory
{
  "productId": "product-uuid",
  "warehouseId": "warehouse-uuid",
  "quantity": 5,
  "unit": "kg"
}
→ Auto-increment: 10.936 + 8.2 = 19.136 yards

# Step 4: Customer buys 7 yards
POST /api/invoices
{
  "items": [{
    "productId": "product-uuid",
    "quantity": 7,
    "unitPrice": 25.00
  }]
}
→ Inventory deducted: 19.136 - 7 = 12.136 yards

# Step 5: Manual adjustment (remove 2 meters damaged)
POST /api/inventory/:id/adjust
{
  "adjustment": -2,
  "unit": "meter",
  "reason": "Damaged"
}
→ Inventory adjusted: 12.136 - 2.187 = 9.949 yards

# Final inventory: 9.949 yards
```

## Console Logs

The system logs all unit conversions and inventory operations for tracking:

```
Unit conversion: 5 kg → 8.2 yard
Inventory unit conversion: 10 meter → 10.936 yard
Inventory created: Cotton Fabric in Warehouse A - 10.936 yards

Inventory unit conversion: 5 kg → 8.2 yard
Inventory incremented: Cotton Fabric in Warehouse A - Added 8.2 yards, Total: 19.136 yards

Invoice deduction: Cotton Fabric - Deducted 7 yards for invoice INV-2025-001
Inventory adjusted: Cotton Fabric - -7 yards (Invoice INV-2025-001), New total: 12.136 yards

Adjustment unit conversion: -2 meter → -2.187 yard
Inventory adjusted: Cotton Fabric - -2.187 yards (Damaged), New total: 9.949 yards
```

## API Behavior

### Adding Inventory with Different Units

```typescript
// Scenario: Mixed units from different suppliers

// Supplier A sends 5 kg
POST /api/inventory { quantity: 5, unit: "kg" }
→ Creates: 8.2 yards

// Supplier B sends 10 meters (same product, same warehouse)
POST /api/inventory { quantity: 10, unit: "meter" }
→ Increments: 8.2 + 10.936 = 19.136 yards

// Supplier C sends 5 yards
POST /api/inventory { quantity: 5, unit: "yard" }
→ Increments: 19.136 + 5 = 24.136 yards

// All stored consistently in yards!
```

### Querying Inventory

```bash
GET /api/inventory

# Response (all in yards):
[
  {
    "id": "inventory-uuid",
    "product": {
      "name": "Cotton Fabric",
      "unit": "yard"
    },
    "warehouse": {
      "name": "Warehouse A"
    },
    "quantity": 24.136,
    "unit": "yard",
    "minimumQuantity": 10,
    "maximumQuantity": 1000
  }
]
```

## Error Handling

### Insufficient Inventory

The system checks quantities in yards:

```bash
# Current inventory: 9.949 yards

# Try to sell 15 yards
POST /api/invoices
{
  "items": [{
    "quantity": 15  # In yards
  }]
}

# Error response:
{
  "statusCode": 400,
  "message": "Insufficient inventory for product Cotton Fabric. Available: 9.949, Requested: 15"
}
```

### Negative Quantity Prevention

```bash
# Current: 9.949 yards

# Try to remove 12 yards
POST /api/inventory/:id/adjust
{
  "adjustment": -12,
  "unit": "yard"
}

# Error response:
{
  "statusCode": 400,
  "message": "Adjustment would result in negative quantity. Current: 9.949 yards, Adjustment: -12 yards"
}
```

## Benefits

### ✅ Consistency

- All inventory always in yards
- No confusion about units
- Easy comparisons and calculations

### ✅ Flexibility

- Accept inventory in any unit (kg, meter, foot, etc.)
- Automatic conversion to yards
- Works with mixed suppliers using different units

### ✅ Accuracy

- Decimal precision (3 decimal places)
- Accurate conversions
- No rounding errors

### ✅ Traceability

- All conversions logged
- Easy to audit
- Clear error messages in yards

## Database Schema

```sql
-- Inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  warehouse_id UUID REFERENCES warehouses(id),
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10, 3) DEFAULT 0,  -- Always in yards
  unit VARCHAR(20) DEFAULT 'yard',     -- Always 'yard'
  minimum_quantity DECIMAL(10, 3) DEFAULT 0,  -- In yards
  maximum_quantity DECIMAL(10, 3),     -- In yards
  location_code VARCHAR(50),
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(warehouse_id, product_id)
);
```

## Important Notes

### ⚠️ Unit Field

The `unit` field in the inventory table will **always** be `'yard'`. It's included for:

- Clarity and documentation
- Future extensibility
- Explicit validation

### ⚠️ Decimal Precision

Quantities are stored with 3 decimal places:

- `quantity: decimal(10, 3)`
- Allows values like `8.254 yards`
- Sufficient precision for most fabric measurements

### ⚠️ Invoice Quantities

When creating invoices, the `quantity` in invoice items is assumed to be in **yards** (since products are in yards). The system will deduct that exact yard amount from inventory.

## Testing

### Test Inventory Unit Conversions

```bash
# 1. Create product
curl -X POST http://localhost:3000/api/products \
  -d '{"name": "Test Fabric", "weight": 5, "unit": "kg", "price": 25}'

# 2. Add inventory in kg
curl -X POST http://localhost:3000/api/inventory \
  -d '{"productId": "uuid", "warehouseId": "uuid", "quantity": 5, "unit": "kg"}'

# 3. Check inventory (should be 8.2 yards)
curl http://localhost:3000/api/inventory

# 4. Add more in meters
curl -X POST http://localhost:3000/api/inventory \
  -d '{"productId": "uuid", "warehouseId": "uuid", "quantity": 10, "unit": "meter"}'

# 5. Check inventory (should be 19.136 yards)
curl http://localhost:3000/api/inventory

# 6. Adjust by removing 1 kg
curl -X POST http://localhost:3000/api/inventory/:id/adjust \
  -d '{"adjustment": -1, "unit": "kg", "reason": "Test removal"}'

# 7. Final check (should be ~17.5 yards)
curl http://localhost:3000/api/inventory
```

## Summary

✅ **Inventory is fully unit-aware**

- All quantities stored in yards
- Accepts input in any supported unit
- Auto-converts to yards
- Maintains consistency across all operations

✅ **Decrements work correctly**

- Invoice deductions in yards
- Manual adjustments with unit conversion
- Always operates on the yard-based quantity

✅ **Complete audit trail**

- All conversions logged
- Operation results logged
- Easy to track and debug

---

**Result:** The inventory system is now fully integrated with unit conversion, ensuring all operations (add, adjust, deduct) work consistently in yards, regardless of the input unit provided.
