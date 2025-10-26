import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (!value) return null;

        const errors: string[] = [];

        if (value.length < 8) {
            errors.push('Password must be at least 8 characters long.');
        }

        if (/^\d+$/.test(value)) {
            errors.push('Password cannot be entirely numeric.');
        }

        if (!/[A-Za-z]/.test(value)) {
            errors.push('Password must contain at least one letter.');
        }

        const common = ['password', '12345678', 'qwerty', 'abc123'];
        if (common.includes(value.toLowerCase())) {
            errors.push('This password is too common.');
        }

        return errors.length ? { passwordStrength: errors } : null;
    };
}
