import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {
    BehaviorSubject,
    Observable,
    of,
    switchMap,
    tap,
    catchError,
    map,
    filter, shareReplay,
} from 'rxjs';
import {Router} from '@angular/router';
import {User} from './user-interface';
import {environment} from '../../environments/environment';

function isUser(u: User | null): u is User {
    return u !== null;
}

@Injectable({providedIn: 'root'})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/users/`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
    }

    private sessionLoad$?: Observable<User | null>;

    loadSessionOnce$(): Observable<User | null> {
        if (!this.sessionLoad$) {
            this.sessionLoad$ = this.getCurrentUser().pipe(
                map((u) => u ?? null),
                catchError(() => of(null)),
                // share across all subscribers
                // IMPORTANT: replays the last value so guards/components don't re-fetch
                // If you want it to re-check later, reset sessionLoad$ when needed.
                shareReplay(1)
            );
        }
        return this.sessionLoad$;
    }

    // 👇 Автоматично зареждане на потребителя при стартиране (reload)
    initUserSession(): void {
        const cached = localStorage.getItem('user');
        if (cached) {
            try {
                this.currentUserSubject.next(JSON.parse(cached));
            } catch {
                localStorage.removeItem('user');
            }
        }

        this.getCurrentUser().pipe(
            catchError((err) => {
                localStorage.removeItem('user');
                this.currentUserSubject.next(null);
                return of(null);
            })
        ).subscribe((user) => {
            if (user) localStorage.setItem('user', JSON.stringify(user));
        });
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    login(email: string, password: string): Observable<User> {
        return this.http
            .post(`${this.apiUrl}login/`, {email, password}, {withCredentials: true})
            .pipe(
                switchMap(() => this.getCurrentUser()),
                tap((user) => localStorage.setItem('user', JSON.stringify(user))),
                filter(isUser)
            );
    }

    register(email: string, firstName: string, lastName: string, password: string): Observable<User> {
        return this.http
            .post(
                `${this.apiUrl}register/`,
                {email, first_name: firstName, last_name: lastName, password},
                {headers: new HttpHeaders({'Content-Type': 'application/json'}), withCredentials: true}
            )
            .pipe(
                switchMap(() => this.getCurrentUser()),
                tap((user) => {
                    if (user) {
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                }),
                filter(isUser)
            );
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}logout/`, {}, {withCredentials: true}).pipe(
            tap(() => {
                this.currentUserSubject.next(null);
                localStorage.removeItem('user');
                this.sessionLoad$ = undefined;
            })
        );
    }

    refresh(): Observable<any> {
        return this.http.post(`${this.apiUrl}refresh/`, {}, {withCredentials: true});
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}me/`, {withCredentials: true}).pipe(
            tap((user) => this.currentUserSubject.next(user))
        );
    }

    updateMe(payload: any): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}me/`, payload, {withCredentials: true}).pipe(
            tap((user) => {
                this.currentUserSubject.next(user);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    setCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
    }

    ensureSession$(): Observable<boolean> {
        return this.isLoggedIn() ? of(true) : this.getCurrentUser().pipe(map((u) => !!u));
    }

    getUser(): User | null {
        return this.currentUserSubject.value;
    }
}
