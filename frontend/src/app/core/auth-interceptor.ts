import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, filter, switchMap, take, throwError, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

const REFRESH_PATH = '/users/refresh/';
const LOGIN_ROUTE = '/login';

const REFRESH_URL = `${API}${REFRESH_PATH}`;

let isRefreshing = false;
const refreshDone$ = new Subject<void>();

function prepareRequest(req: HttpRequest<unknown>) {
    const isApiRelative =
        req.url.startsWith('/users/') ||
        req.url.startsWith('/api/');

    const finalUrl = isApiRelative ? `${API}${req.url}` : req.url;

    return req.clone({
        url: finalUrl,
        withCredentials: true,
    });
}

function callRefresh(next: HttpHandlerFn) {
    const refreshReq = new HttpRequest('POST', REFRESH_PATH, {});
    return next(prepareRequest(refreshReq));
}

function shouldSkipAuthHandling(url: string) {
    return (
        url.startsWith(REFRESH_URL) ||
        url.endsWith('/users/login/') ||
        url.endsWith('/users/register/') ||
        url.endsWith('/users/logout/')
    );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    const authReq = prepareRequest(req);

    if (shouldSkipAuthHandling(authReq.url)) {
        return next(authReq);
    }

    return next(authReq).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            if (isRefreshing) {
                return refreshDone$.pipe(
                    take(1),
                    switchMap(() => next(prepareRequest(req)))
                );
            }

            isRefreshing = true;

            return callRefresh(next).pipe(
                switchMap(() => {
                    isRefreshing = false;
                    refreshDone$.next();
                    return next(prepareRequest(req));
                }),
                catchError((refreshErr) => {
                    isRefreshing = false;

                    router.navigateByUrl(LOGIN_ROUTE);
                    return throwError(() => refreshErr);
                })
            );
        })
    );
};
