import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth-service';
import {User} from '../../services/user-interface';
import {strictEmailValidator} from '../../core/email-validator';
import {passwordStrengthValidator} from '../../core/password-strength-validator';
import {passwordMatchValidator} from '../../core/password-match-validator';
import {NgIf} from '@angular/common';

@Component({
    selector: 'app-profile',
    imports: [FormsModule, ReactiveFormsModule, NgIf],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
    form: FormGroup;
    user?: User;
    errorMessage: string = '';
    successMessage = '';
    private successTimeout?: any;

    constructor(public authService: AuthService, private fb: FormBuilder) {
        this.form = this.fb.group(
            {
                email: ['', [Validators.required, strictEmailValidator]],
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],


                currentPassword: [''],
                newPassword: [''],
                confirmNewPassword: [''],
            },
            {
                validators: passwordMatchValidator('newPassword', 'confirmNewPassword'),
            }
        );
    }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe((user) => {
            if (!user) return;
            this.user = user;

            this.form.patchValue({
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            });
        });

        this.form.valueChanges.subscribe(() => this.updatePasswordValidators());
    }

    private updatePasswordValidators(): void {
        const current = this.form.get('currentPassword')!.value?.trim();
        const next = this.form.get('newPassword')!.value?.trim();
        const confirm = this.form.get('confirmNewPassword')!.value?.trim();

        const wantsPasswordChange = !!(current || next || confirm);

        const currentCtrl = this.form.get('currentPassword')!;
        const newCtrl = this.form.get('newPassword')!;
        const confirmCtrl = this.form.get('confirmNewPassword')!;

        if (wantsPasswordChange) {
            currentCtrl.setValidators([Validators.required]);
            newCtrl.setValidators([Validators.required, passwordStrengthValidator()]);
            confirmCtrl.setValidators([Validators.required]);
        } else {
            currentCtrl.clearValidators();
            newCtrl.clearValidators();
            confirmCtrl.clearValidators();
        }

        currentCtrl.updateValueAndValidity({emitEvent: false});
        newCtrl.updateValueAndValidity({emitEvent: false});
        confirmCtrl.updateValueAndValidity({emitEvent: false});
    }

    onSubmit(): void {

        if (this.form.invalid) return;

        const v = this.form.value;

        const wantsPasswordChange = !!(
            v.currentPassword?.trim() ||
            v.newPassword?.trim() ||
            v.confirmNewPassword?.trim()
        );

        const payload: any = {
            email: v.email,
            first_name: v.firstName,
            last_name: v.lastName,
        };

        if (wantsPasswordChange) {
            payload.current_password = v.currentPassword;
            payload.new_password = v.newPassword;
        }

        this.authService.updateMe(payload).subscribe({
            next: (updatedUser) => {
                this.showSuccess('Profile updated successfully.');

                this.form.patchValue({
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                });

                this.form.markAsPristine();
            },
            error: (err) => {
                console.log(err);
                this.showError()
            },
        });

    }

    private showSuccess(message: string): void {
        this.successMessage = message;

        if (this.successTimeout) {
            clearTimeout(this.successTimeout);
        }

        this.successTimeout = setTimeout(() => {
            this.successMessage = '';
        }, 3000);
    }
    private showError(): void {
        this.errorMessage = 'Wrong password, try again.';


        if (this.successTimeout) {
            clearTimeout(this.successTimeout);
        }

        this.successTimeout = setTimeout(() => {
            this.errorMessage = '';
        }, 3000);
    }
}
