import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  min?: number;
  pattern?: RegExp;
  message: string;
}

/**
 * Pure validation function — exported for testability.
 * Returns the first failing rule's message, or null if all pass.
 */
export function validateValue(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (rule.required) {
      if (value === undefined || value === null || value === '') {
        return rule.message;
      }
    }

    if (rule.minLength !== undefined) {
      if (typeof value === 'string' && value.length > 0 && value.length < rule.minLength) {
        return rule.message;
      }
    }

    if (rule.min !== undefined) {
      const num = typeof value === 'number' ? value : Number(value);
      if (!isNaN(num) && num < rule.min) {
        return rule.message;
      }
    }

    if (rule.pattern) {
      if (typeof value === 'string' && value.length > 0 && !rule.pattern.test(value)) {
        return rule.message;
      }
    }
  }

  return null;
}

export function useFormValidation(rulesConfig: Record<string, ValidationRule[]>) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const fieldRules = rulesConfig[name];
      if (!fieldRules) return null;

      const error = validateValue(value, fieldRules);

      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        }
        const next = { ...prev };
        delete next[name];
        return next;
      });

      return error;
    },
    [rulesConfig],
  );

  const validate = useCallback(
    (values: Record<string, any>): boolean => {
      const newErrors: Record<string, string> = {};

      for (const name of Object.keys(rulesConfig)) {
        const error = validateValue(values[name], rulesConfig[name]);
        if (error) {
          newErrors[name] = error;
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [rulesConfig],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return { errors, validate, validateField, clearErrors, isValid };
}
