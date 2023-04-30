import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "./modules/shared/guard/auth.guard";

const lazyModules = {
  'auth': import('./modules/auth/auth.module'),
  'employee': import('./modules/employee/employee.module'),
};
const routes: Routes = [
  {
    path: '',
    redirectTo: 'employee',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => lazyModules.auth.then(module => module.AuthModule)
  },
  {
    path: 'employee',
    loadChildren: () => lazyModules.employee.then(module => module.EmployeeModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
