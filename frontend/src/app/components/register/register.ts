import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {strictEmailValidator} from '../../core/email-validator';
import {passwordMatchValidator} from '../../core/password-match-validator';

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


    constructor(public formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            email: ['', [Validators.required, strictEmailValidator]],
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required],
        },
        {
            validators: passwordMatchValidator('password', 'confirmPassword'),
        })
    }

    onSubmit() {
        if(this.form.valid) {
            console.log(this.form.value)
        }

    }

    get f() {
        return this.form.controls;
    }

}
