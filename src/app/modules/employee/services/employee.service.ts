import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {EmployeeModel} from "../../../core/models";
import {environment} from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private prefix = `${environment.apiUrl}/employee`;

  constructor(
    private httpClient: HttpClient
  ) { }

  getEmployees(): Observable<EmployeeModel> {
    return this.httpClient.get<EmployeeModel>(`${this.prefix}`);
  }
}
