import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth-service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-nav',
    imports: [
        RouterLink,
        AsyncPipe
    ],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
    user$;

    constructor(private authService: AuthService, private router: Router) {
        this.user$ = this.authService.currentUser$;
    }


    logout(): void {
        this.authService.logout().subscribe(() => this.router.navigate(['/login']));
    }
}
