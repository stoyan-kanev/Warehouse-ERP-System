import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth-service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-login',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class LoginComponent {
    form: FormGroup;
    error : boolean = false;
    constructor(private formBuilder: FormBuilder, private authService: AuthService,private router: Router) {
        this.form = formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],

        })
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.authService.login(this.form.value.email, this.form.value.password)
            .subscribe({
                next: (user) => {
                    localStorage.setItem('user', JSON.stringify(user));
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    console.error('Failed to fetch user data:', error);
                    this.error = true;
                }
            });
    }

    get f() {
        return this.form.controls;
    }
}
