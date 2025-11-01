import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const REFRESH_URL = `${environment.apiUrl}/users/refresh/`;
const LOGIN_ROUTE = '/login';

const FRONTEND_SKIP_ROUTES = ['/', '/login', '/register'];

function prepareRequest(req: HttpRequest<unknown>) {
    const isApiRelative =
        req.url.startsWith('/users/') ||
        req.url.startsWith('/api/'); //
    const finalUrl = isApiRelative
        ? `${environment.apiUrl}${req.url}`
        : req.url;

    return req.clone({
        url: finalUrl,
        withCredentials: true,
    });
}

function callRefresh(next: HttpHandlerFn) {
    const refreshReq = new HttpRequest(
        'POST',
        REFRESH_URL,
        {},
        { withCredentials: true }
    );

    return next(refreshReq);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    const currentRoute = router.url;
    if (FRONTEND_SKIP_ROUTES.includes(currentRoute)) {
        return next(req);
    }

    const authReq = prepareRequest(req);

    return next(authReq).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse)) {
                return throwError(() => error);
            }

            if (error.status !== 401) {
                return throwError(() => error);
            }

            if (authReq.url.startsWith(REFRESH_URL)) {
                router.navigateByUrl(LOGIN_ROUTE);
                return throwError(() => error);
            }

            return callRefresh(next).pipe(
                switchMap(() => {
                    const retryReq = prepareRequest(req);
                    return next(retryReq);
                }),
                catchError(refreshErr => {
                    router.navigateByUrl(LOGIN_ROUTE);
                    return throwError(() => refreshErr);
                })
            );
        })
    );
};
