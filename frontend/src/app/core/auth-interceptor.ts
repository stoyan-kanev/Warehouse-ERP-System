import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn,
} from '@angular/common/http';
import { catchError, switchMap, take, throwError, Subject, of } from 'rxjs';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

const REFRESH_PATH = '/users/refresh/';
const REFRESH_URL = `${API}${REFRESH_PATH}`;

let isRefreshing = false;
const refreshDone$ = new Subject<boolean>();

let didBootstrapRefresh = false;

function prepareRequest(req: HttpRequest<unknown>) {
    const isApiRelative = req.url.startsWith('/users/') || req.url.startsWith('/api/');
    const finalUrl = isApiRelative ? `${API}${req.url}` : req.url;

    return req.clone({
        url: finalUrl,
        withCredentials: true,
    });
}

function callRefresh(next: HttpHandlerFn) {
    const refreshReq = new HttpRequest('POST', REFRESH_URL, {}, { withCredentials: true });
    return next(refreshReq);
}

function shouldSkipAuthHandling(url: string) {
    return (
        url.startsWith(REFRESH_URL) ||
        url.endsWith('/users/login/') ||
        url.endsWith('/users/register/') ||
        url.endsWith('/users/logout/')
    );
}

function isApiCall(url: string) {
    return url.startsWith(API) || url.startsWith('/users/') || url.startsWith('/api/');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authReq = prepareRequest(req);

    if (shouldSkipAuthHandling(authReq.url)) {
        return next(authReq);
    }

    if (!didBootstrapRefresh && isApiCall(req.url)) {
        didBootstrapRefresh = true;

        return callRefresh(next).pipe(
            switchMap(() => next(authReq)),
            catchError(() => next(authReq))
        );
    }

    return next(authReq).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            if (isRefreshing) {
                return refreshDone$.pipe(
                    take(1),
                    switchMap((ok) => {
                        if (!ok) return throwError(() => error);
                        return next(prepareRequest(req));
                    })
                );
            }

            isRefreshing = true;

            return callRefresh(next).pipe(
                switchMap(() => {
                    isRefreshing = false;
                    refreshDone$.next(true);

                    return next(prepareRequest(req));
                }),
                catchError((refreshErr) => {
                    isRefreshing = false;

                    refreshDone$.next(false);

                    localStorage.removeItem('user');

                    return throwError(() => refreshErr);
                })
            );
        })
    );
};
