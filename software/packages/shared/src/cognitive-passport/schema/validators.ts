import { FIELD_GROUPS, type FieldGroup } from './field-groups';

export interface FieldError {
  field: string;
  message: string;
  code: 'required' | 'pattern' | 'max_length' | 'min_length' | 'enum' | 'range' | 'type' | 'custom';
}

export type Validator<T = unknown> = (value: T, path: string) => FieldError[];

export function required(message?: string): Validator {
  return (value, path) => {
    if (value === undefined || value === null || value === '') {
      return [{ field: path, message: message ?? 'This field is required', code: 'required' }];
    }
    return [];
  };
}

export function pattern(regex: RegExp, message?: string): Validator<string> {
  return (value, path) => {
    if (!value || regex.test(value)) return [];
    return [{ field: path, message: message ?? 'Invalid format', code: 'pattern' }];
  };
}

export function maxLength(max: number, message?: string): Validator<string> {
  return (value, path) => {
    if (!value || value.length <= max) return [];
    return [{ field: path, message: message ?? `Must be ${max} characters or fewer`, code: 'max_length' }];
  };
}

export function minLength(min: number, message?: string): Validator<string> {
  return (value, path) => {
    if (!value || value.length >= min) return [];
    return [{ field: path, message: message ?? `Must be at least ${min} characters`, code: 'min_length' }];
  };
}

export function isEnum<T extends string>(values: readonly T[], message?: string): Validator<T> {
  return (value, path) => {
    if (value === undefined || value === null) return [];
    if (!values.includes(value)) {
      return [{ field: path, message: message ?? `Must be one of: ${values.join(', ')}`, code: 'enum' }];
    }
    return [];
  };
}

export function range(min: number, max: number, message?: string): Validator<number> {
  return (value, path) => {
    if (value === undefined || value === null) return [];
    if (typeof value !== 'number' || value < min || value > max) {
      return [{ field: path, message: message ?? `Must be between ${min} and ${max}`, code: 'range' }];
    }
    return [];
  };
}

export function isType(type: 'string' | 'number' | 'boolean' | 'object' | 'array', message?: string): Validator {
  return (value, path) => {
    if (value === undefined || value === null) return [];
    const actual = Array.isArray(value) ? 'array' : typeof value;
    if (actual !== type) {
      return [{ field: path, message: message ?? `Expected ${type}, got ${actual}`, code: 'type' }];
    }
    return [];
  };
}

export function compose<T>(...validators: Validator<T>[]): Validator<T> {
  return (value, path) => validators.flatMap(v => v(value, path));
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

export const FIELD_VALIDATORS: Partial<Record<FieldGroup, Validator[]>> = {
  pii: [
    compose(
      required(),
      isType('object', 'Personal identifiers must be an object'),
    ),
  ],
  med: [
    isType('object', 'Medical info must be an object'),
  ],
  cog: [
    compose(
      required('Cognitive profile is required for personalized experience'),
      isType('object'),
    ),
  ],
  comm: [
    compose(
      required('Communication preferences are required'),
      isType('object'),
    ),
  ],
  prof: [isType('object')],
  fam: [isType('object', 'Family graph must be an object')],
  org: [isType('object')],
  leg: [isType('object')],
  ben: [isType('object')],
  fin: [isType('object')],
  work: [isType('object')],
  vault: [isType('object')],
  comms: [isType('object')],
  sched: [isType('object', 'Schedule must be an object with availability windows')],
  lex: [isType('object')],
  agt: [isType('object')],
  sent: [isType('object')],
  gen: [isType('object')],
};

export function validateFieldGroup(fg: FieldGroup, value: unknown): FieldError[] {
  const validators = FIELD_VALIDATORS[fg];
  if (!validators) return [];
  return validators.flatMap(v => v(value, `fields.${fg}`));
}

export function validatePassport(passport: { fields?: Partial<Record<FieldGroup, unknown>> }): FieldError[] {
  if (!passport.fields) return [{ field: 'fields', message: 'Passport must have fields', code: 'required' }];
  return Object.entries(passport.fields).flatMap(([key, value]) =>
    validateFieldGroup(key as FieldGroup, value),
  );
}
