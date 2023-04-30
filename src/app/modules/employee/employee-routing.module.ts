import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DisplayComponent} from "./display/display.component";
import {DisplayResolver} from "./services/display.resolver";
const routes: Routes = [
  {
    path: '',
    component: DisplayComponent,
    resolve: {
      employees: DisplayResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
