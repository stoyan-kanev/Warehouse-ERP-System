import { AbstractControl, ValidationErrors } from '@angular/forms';

export function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;

    // по-строг regex (допуска букви, цифри, ., _, -, + преди @)
    // изисква домейн с точки и TLD >= 2 chars
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(value)) {
        return { invalidEmail: true };
    }

    return null;
}
