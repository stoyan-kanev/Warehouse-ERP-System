import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';


export type WarehouseCreatePayload = {
    name: string;
    location: string;
    is_active: boolean;
};

@Component({
  selector: 'app-warehouse-creation',
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './warehouse-creation.html',
  styleUrl: './warehouse-creation.css',
})
export class WarehouseCreation {
    @Input() isSaving = false;

    @Input() initialValue?: Partial<WarehouseCreatePayload>;

    @Output() cancel = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<WarehouseCreatePayload>();

    form!: FormGroup;
    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(255)]],
            location: ['', [Validators.required, Validators.maxLength(255)]],
            is_active: [true],
        });
    }

    ngOnInit(): void {
        if (this.initialValue) {
            this.form.patchValue({
                name: this.initialValue.name ?? '',
                location: this.initialValue.location ?? '',
                is_active: this.initialValue.is_active ?? true,
            });
        }
    }

    isInvalid(controlName: keyof WarehouseCreatePayload): boolean {
        const c = this.form.get(controlName as string);
        return !!c && c.invalid && (c.dirty || c.touched);
    }

    onCancel(): void {
        this.cancel.emit();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload: WarehouseCreatePayload = {
            name: (this.form.value.name ?? '').trim(),
            location: (this.form.value.location ?? '').trim(),
            is_active: !!this.form.value.is_active,
        };

        this.submitForm.emit(payload);
    }
}
