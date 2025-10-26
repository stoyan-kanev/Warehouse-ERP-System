import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {strictEmailValidator} from '../../core/email-validator';
import {passwordMatchValidator} from '../../core/password-match-validator';
import {AuthService} from '../../services/auth-service';
import {Router} from '@angular/router';
import {passwordStrengthValidator} from '../../core/password-strength-validator';

@Component({
    selector: 'app-register',
    imports: [
        ReactiveFormsModule,
        NgIf
    ],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class RegisterComponent {
    form: FormGroup;


    constructor(public formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
        this.form = formBuilder.group({
                email: ['', [Validators.required, strictEmailValidator]],
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],
                password: ['', [Validators.required, passwordStrengthValidator()]],
                confirmPassword: ['', Validators.required],
            },
            {
                validators: passwordMatchValidator('password', 'confirmPassword'),
            })
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.authService.register(
            this.form.value.email,
            this.form.value.firstName,
            this.form.value.lastName,
            this.form.value.password)
            .subscribe({
                next: (user) => {
                    localStorage.setItem('user', JSON.stringify(user));
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    console.error('Failed to fetch user data:', error);
                }
            });
    }

    get f() {
        return this.form.controls;
    }

}
