import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home';
import {LoginComponent} from './components/login/login';
import {RegisterComponent} from './components/register/register';
import {ProductList} from './components/products/product-list/product-list';
import {ProfileComponent} from './components/profile/profile';
import {authUserGuard} from '../environments/user-guard';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'login', component: LoginComponent,},
    {path: 'register', component: RegisterComponent,},
    {path: 'product-list', component: ProductList},
    {path: 'profile', component:ProfileComponent}
];
