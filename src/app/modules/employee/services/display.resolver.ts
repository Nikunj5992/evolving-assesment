import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot} from '@angular/router';
import { Observable } from 'rxjs';
import {EmployeeModel} from "../../../core/models";
import {EmployeeService} from "./employee.service";

@Injectable({
  providedIn: 'root'
})
export class DisplayResolver implements Resolve<EmployeeModel> {
  constructor(
    private employeeService: EmployeeService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<EmployeeModel> {
    return this.employeeService.getEmployees();
  }
}
