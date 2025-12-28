import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const http = inject(HttpClient);
    const router = inject(Router);

    return http.get('/users/me', { withCredentials: true }).pipe(
        map(() => true),
        catchError(() => {
            router.navigateByUrl('/login');
            return of(false);
        })
    );
};

