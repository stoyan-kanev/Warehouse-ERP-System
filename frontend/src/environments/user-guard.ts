import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../app/services/auth-service';

export const authUserGuard: () => void = () => {
    const router = inject(Router)
    const authService = inject(AuthService)

    if (authService.getCurrentUser()){
        router.navigateByUrl('/')
    }

};
