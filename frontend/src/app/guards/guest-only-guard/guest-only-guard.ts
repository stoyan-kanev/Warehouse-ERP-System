import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { catchError, map, of } from 'rxjs';

export const guestOnlyGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getCurrentUser().pipe(
        map(() => router.createUrlTree(['/'])),
        catchError(() => of(true))
    );
};
