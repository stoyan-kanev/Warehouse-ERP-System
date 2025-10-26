import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Nav} from './components/nav/nav';
import {AuthService} from './services/auth-service';

@Component({
  selector: 'app-root',
    imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.authService.initUserSession();
    }
}
