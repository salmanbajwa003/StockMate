import { Transform } from 'class-transformer';
import { convertToStandardUnit } from '../utils/unit-converter';

/**
 * Decorator to automatically convert units to standard unit (yard)
 * Usage: @ConvertToStandardUnit() on weight property
 */
export function ConvertToStandardUnit() {
  return Transform(({ value, obj }) => {
    if (value !== undefined && obj.unit) {
      const conversion = convertToStandardUnit(value, obj.unit);
      // Store conversion info in metadata
      obj._conversionApplied = conversion.conversionApplied;
      obj._originalValue = conversion.originalValue;
      obj._originalUnit = conversion.originalUnit;
      return conversion.value;
    }
    return value;
  });
}
