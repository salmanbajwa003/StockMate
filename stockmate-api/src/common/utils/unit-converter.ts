/**
 * Unit Converter Utility
 * Converts various units to the standard backend unit (yard)
 */

export enum UnitType {
  // Length units
  YARD = 'yard',
  METER = 'meter',
  FOOT = 'foot',
  INCH = 'inch',
  CENTIMETER = 'centimeter',

  // Weight units (for fabric - requires conversion factor)
  KILOGRAM = 'kg',
  GRAM = 'gram',
  POUND = 'pound',

  // Piece/Count units
  PIECE = 'piece',
  ROLL = 'roll',
}

// Standard unit for backend storage
export const STANDARD_UNIT = UnitType.YARD;

// Conversion rates to yards
const LENGTH_TO_YARD: Record<string, number> = {
  [UnitType.YARD]: 1,
  [UnitType.METER]: 1.09361, // 1 meter = 1.09361 yards
  [UnitType.FOOT]: 0.333333, // 1 foot = 0.333333 yards
  [UnitType.INCH]: 0.0277778, // 1 inch = 0.0277778 yards
  [UnitType.CENTIMETER]: 0.0109361, // 1 cm = 0.0109361 yards
};

// For weight-based units, we need fabric density
// Average fabric weight: ~200 GSM (grams per square meter)
// Fabric width: ~1.5 yards (standard)
// This is an approximation and should be adjusted per fabric type
const WEIGHT_TO_YARD: Record<string, number> = {
  [UnitType.KILOGRAM]: 1.64, // 1 kg ≈ 1.64 yards (for avg fabric)
  [UnitType.GRAM]: 0.00164, // 1 gram ≈ 0.00164 yards
  [UnitType.POUND]: 0.744, // 1 pound ≈ 0.744 yards
};

// Piece-based units (no conversion, stored as-is but with unit marked)
const PIECE_UNITS = [UnitType.PIECE, UnitType.ROLL];

export interface ConversionResult {
  value: number;
  unit: UnitType;
  originalValue: number;
  originalUnit: string;
  conversionApplied: boolean;
}

/**
 * Converts any supported unit to the standard unit (yard)
 */
export function convertToStandardUnit(value: number, fromUnit: string): ConversionResult {
  const normalizedUnit = fromUnit.toLowerCase().trim() as UnitType;

  // If already in standard unit, no conversion needed
  if (normalizedUnit === UnitType.YARD) {
    return {
      value,
      unit: UnitType.YARD,
      originalValue: value,
      originalUnit: fromUnit,
      conversionApplied: false,
    };
  }

  // Check if it's a piece-based unit (no conversion)
  if (PIECE_UNITS.includes(normalizedUnit as UnitType)) {
    return {
      value,
      unit: normalizedUnit,
      originalValue: value,
      originalUnit: fromUnit,
      conversionApplied: false,
    };
  }

  // Try length conversion
  if (LENGTH_TO_YARD[normalizedUnit]) {
    const convertedValue = value * LENGTH_TO_YARD[normalizedUnit];
    return {
      value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimals
      unit: STANDARD_UNIT,
      originalValue: value,
      originalUnit: fromUnit,
      conversionApplied: true,
    };
  }

  // Try weight conversion (approximation)
  if (WEIGHT_TO_YARD[normalizedUnit]) {
    const convertedValue = value * WEIGHT_TO_YARD[normalizedUnit];
    return {
      value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimals
      unit: STANDARD_UNIT,
      originalValue: value,
      originalUnit: fromUnit,
      conversionApplied: true,
    };
  }

  // If unit is not recognized, return as-is with warning
  console.warn(`Unit '${fromUnit}' not recognized. Storing value as-is.`);
  return {
    value,
    unit: STANDARD_UNIT,
    originalValue: value,
    originalUnit: fromUnit,
    conversionApplied: false,
  };
}

/**
 * Converts from standard unit (yard) to another unit
 */
export function convertFromStandardUnit(value: number, toUnit: string): ConversionResult {
  const normalizedUnit = toUnit.toLowerCase().trim() as UnitType;

  // If already in target unit
  if (normalizedUnit === STANDARD_UNIT) {
    return {
      value,
      unit: STANDARD_UNIT,
      originalValue: value,
      originalUnit: STANDARD_UNIT,
      conversionApplied: false,
    };
  }

  // Try length conversion
  if (LENGTH_TO_YARD[normalizedUnit]) {
    const convertedValue = value / LENGTH_TO_YARD[normalizedUnit];
    return {
      value: Math.round(convertedValue * 1000) / 1000,
      unit: normalizedUnit,
      originalValue: value,
      originalUnit: STANDARD_UNIT,
      conversionApplied: true,
    };
  }

  // Try weight conversion
  if (WEIGHT_TO_YARD[normalizedUnit]) {
    const convertedValue = value / WEIGHT_TO_YARD[normalizedUnit];
    return {
      value: Math.round(convertedValue * 1000) / 1000,
      unit: normalizedUnit,
      originalValue: value,
      originalUnit: STANDARD_UNIT,
      conversionApplied: true,
    };
  }

  // Return as-is if unit not recognized
  return {
    value,
    unit: normalizedUnit,
    originalValue: value,
    originalUnit: STANDARD_UNIT,
    conversionApplied: false,
  };
}

/**
 * Get list of supported units
 */
export function getSupportedUnits(): string[] {
  return Object.values(UnitType);
}

/**
 * Check if unit is supported
 */
export function isUnitSupported(unit: string): boolean {
  const normalizedUnit = unit.toLowerCase().trim();
  return Object.values(UnitType).includes(normalizedUnit as UnitType);
}

/**
 * Get conversion factor from any unit to yard
 */
export function getConversionFactor(fromUnit: string): number {
  const normalizedUnit = fromUnit.toLowerCase().trim();
  return LENGTH_TO_YARD[normalizedUnit] || WEIGHT_TO_YARD[normalizedUnit] || 1;
}

/**
 * Converts units based on specific business rules:
 * - Meter → Yard (convert quantity)
 * - Yard → Yard (no conversion)
 * - Kg → Kg (no conversion)
 */
export function convertProductUnit(quantity: number, fromUnit: string): ConversionResult {
  const normalizedUnit = fromUnit.toLowerCase().trim() as UnitType;

  // Rule 1: If unit is Meter, convert to Yard
  if (normalizedUnit === UnitType.METER) {
    const convertedValue = quantity * LENGTH_TO_YARD[UnitType.METER];
    return {
      value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimals
      unit: UnitType.YARD,
      originalValue: quantity,
      originalUnit: fromUnit,
      conversionApplied: true,
    };
  }

  // Rule 2: If unit is Yard, keep as Yard
  if (normalizedUnit === UnitType.YARD) {
    return {
      value: quantity,
      unit: UnitType.YARD,
      originalValue: quantity,
      originalUnit: fromUnit,
      conversionApplied: false,
    };
  }

  // Rule 3: If unit is Kg (KILOGRAM), keep as Kg
  if (normalizedUnit === UnitType.KILOGRAM) {
    return {
      value: quantity,
      unit: UnitType.KILOGRAM,
      originalValue: quantity,
      originalUnit: fromUnit,
      conversionApplied: false,
    };
  }

  // For any other unit, return as-is with warning
  console.warn(`Unit '${fromUnit}' does not match conversion rules. Storing as-is.`);
  return {
    value: quantity,
    unit: normalizedUnit,
    originalValue: quantity,
    originalUnit: fromUnit,
    conversionApplied: false,
  };
}
