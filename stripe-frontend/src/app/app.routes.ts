import { Routes } from '@angular/router';
import { PaymentsComponent } from './components/payments/payments.component';
export const routes: Routes = [
    
{ path: 'payment', component: PaymentsComponent },
{ path: '', redirectTo: '/payment', pathMatch: 'full' }

] 