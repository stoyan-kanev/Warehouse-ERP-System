import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home';
import {LoginComponent} from './components/login/login';
import {RegisterComponent} from './components/register/register';
import {ProductList} from './components/products/product-list/product-list';
import {ProfileComponent} from './components/profile/profile';
import {guestOnlyGuard, } from './guards/guest-only-guard/guest-only-guard';
import {authGuard} from './guards/auth-guard/auth-guard-guard';
import {WarehousesComponent} from './components/warehouse/warehouses/warehouses';

export const routes: Routes = [
    {path: '', component: HomeComponent,},
    {path: 'login', component: LoginComponent, canActivate:[guestOnlyGuard]},
    {path: 'register', component: RegisterComponent,canActivate:[guestOnlyGuard]},
    {path: 'product-list', component: ProductList, canActivate:[authGuard] },
    {path: 'profile', component:ProfileComponent, canActivate:[authGuard] },
    {path: 'warehouses', component:WarehousesComponent, canActivate:[authGuard] },
];
