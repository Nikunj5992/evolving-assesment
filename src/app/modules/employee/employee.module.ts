import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayComponent } from './display/display.component';
import {SharedModule} from "../shared/shared.module";
@NgModule({
  declarations: [
    DisplayComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class EmployeeModule { }
