/*
*
* Following is code snippet to understand how I code in Angular typescript.
* I used these code to create angular app, which uses following:
* 1. authGuard: It will provide guard against unAuthenticate visit of app without login
* 2. httpInterceptor: It will intercept http requests calls from application,
*   process/adds further info which needs http requests like header, tokens etc. to that
*   request and call to Back-end.
* 3. directive: It will create one custom structure directive as *ngVar for the purpose to store component variable and use many times
*    in view wherever needed.
* 4. AuthModule(feature-module): It will take care of login user.user can go on login page and do login.
* 5. EmployeeModule(feature-module): It will use to display employee data.
* 6. EmployeeResolver: It will execute before employee display component loads to bring employee data from BE,
*    and provide to employee component before its load, so employee data will available at time of component loaded.
* 7. Models: Added models or interfaces for tightly bind with BE responses.
*
*/


/*
* filename: app.module.ts
* description: This file is used to make app module which is root module in angular app.
* reason of usage: default requirement for angular
*/

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {HttpInterceptor} from "./modules/shared/interceptors/http.interceptor";

@NgModule({
  declarations: [ //declared component
    AppComponent
  ],
  imports: [ //imported modules to use
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { //http interceptor to intercept http requests to Back End
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptor,
      multi: true
    }
  ],
  bootstrap: [ //component to kick-start app
    AppComponent
  ]
})
export class AppModule {
}


/*
* filename: app-routing.module.ts
* description: This file is used to make app routing.
* reason of usage: to define routes, to indicate lazy-load modules for each route which modules only loads
*                  when those routes start in browser
*/
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
    redirectTo: 'employee', //will redirect browser url to employee page
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => lazyModules.auth.then(module => module.AuthModule) //Lazy load module
  },
  {
    path: 'employee',
    loadChildren: () => lazyModules.employee.then(module => module.EmployeeModule), //Lazy load module
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}


/*
* filename: app.component.html
* description: This file is used to make app's view.
* reason of usage: for display contents of application
*/

<router-outlet></router-outlet> <!--will load html content of current route-->


/*
* filename: auth.guard.ts
* description and reason: This file used to give guard against unintended ot unAuthentic access of app routes
*/
import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../../auth/services/auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isUserLoggedIn()) { //checks if user done loggedIn
      localStorage.clear();
      this.router.navigate(['auth']).then(null);
      return false; // false indicate unauthentic access
    }
    return true; // true indicate success access
  }

}

/*
* filename: http.interceptor.ts
* description: this file handles http request executed by application from wherever
* reason: To intercept or process http request before call to Back-end.
*/
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import {from, Observable, switchMap, timeout} from 'rxjs';
import {environment} from "../../../../environments/environment";
import {AuthService} from "../../auth/services/auth.service";
import * as jose from 'jose';

@Injectable()
export class HttpInterceptor implements HttpInterceptor {
  private token = '';
  private headerData: { hash?: string, Authorization?: string; } = { hash: '', Authorization: '' };
  constructor(
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.token = this.authService.getToken();
    if (environment.production) {
      return this.signJWTToken(request.url, request.body).pipe(switchMap((jwt: string) => {
        this.headerData.hash = jwt;
        return this.processNextRequest(request, next, this.headerData, this.token);
      }));
    }
    return this.processNextRequest(request, next, this.headerData, this.token);
  }

  /**
   * Method to generate hash key of signed JWT
   * @param {string} url url of http request
   * @param {any} body body of http request
   * @returns {Observable<string>} returns hash key
   */
  signJWTToken(url: string, body: any): Observable<string> {
    return from((async () => {
      let payload = { url: url.split('?')[1] };
      if (body) {
        payload = { ...body }
      }
      const secret = new TextEncoder().encode(environment.hashKey);
      return await new jose.SignJWT({ 'urn:example:claim': true, ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:example:issuer')
        .setAudience('urn:example:audience')
        .setExpirationTime('1m')
        .sign(secret);
    })());
  }

  /**
   * Method to process next request and add header
   * @param {HttpRequest<any>} req http request
   * @param {HttpHandler} next next request
   * @param {hash?: string, Authorization?: string;} headerData header collection
   * @param {string} token logged in token
   * @returns {Observable<HttpEvent<any>>} returns httpEvent observable
   */
  processNextRequest(req: HttpRequest<any>, next: HttpHandler, headerData: { hash?: string, Authorization?: string; }, token: string): Observable<HttpEvent<any>> {
    if (token) {
      headerData.Authorization = `Token ${token}`
    }
    const modifiedReq = req.clone({ setHeaders: headerData });
    const timeoutValue = req.headers.get('timeout') || 180000;
    const timeoutValueNumeric = Number(timeoutValue);
    return next.handle(modifiedReq).pipe(timeout(timeoutValueNumeric));
  }
}



/*
* filename: var.directive.ts
* description: this file will create custom directive
* reason: to avoid rewrite same code, put common process code in directive files
*/
import {Directive, Input, TemplateRef, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[ngVar]'
})
export class VarDirective {
  @Input()
  set ngVar(context: any) {
    this.context.$implicit = this.context.ngVar = context;
    this.updateView();
  }

  context: any = {};

  constructor(private vcRef: ViewContainerRef, private templateRef: TemplateRef<any>) {}

  updateView() {
    this.vcRef.clear();
    this.vcRef.createEmbeddedView(this.templateRef, this.context);
  }
}


/*
* filename: employee.resolver.ts
* description: resolver before any route loads
* reason: to complete process before route loads like getting data from BE and make ready to provide component
*         when it loaded
*
*/
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


/*
* filename: employee.model.ts
* description: contains interface for employee data
* reason: to bind employee data-type with BE
*/
export interface EmployeeModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}



/*
* filename: user.model.ts
* description: contains interface for user data
* reason: to bind user data-type with BE
*/
export interface UserModel {
  id: string;
  email: string;
}


/*
* filename: login-request.model.ts
* description: contains interface for login-request data
* reason: to bind login-request data-type with BE
*/
export interface LoginRequestModel {
  email: string;
  password: string;
}


/*
* filename: login-response.model.ts
* description: contains interface for login-response data
* reason: to bind login-response data-type with BE
*/
export interface LoginResponseModel {
  email: string;
  password: string;
}


/*
* filename: auth.module.ts
* reason: to manage auth related process
*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import {AuthRoutingModule} from "./auth-routing.module";
import {ReactiveFormsModule} from "@angular/forms";
@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }


/*
* filename: auth-routing.module.ts
* reason: to manage route come after auth module loads
*/
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }


/*
* filename: auth.service.ts
* reason: create common process for components.
*/
import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {LoginRequestModel, LoginResponseModel} from "../../../core/models";
import {environment} from "../../../../environments/environment";
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private prefix = `${environment.apiUrl}/auth`;

  constructor(
    private httpClient: HttpClient
  ) { }

  processLogin(loginRequest: LoginRequestModel): Observable<any> {
    return this.httpClient.post<LoginResponseModel>(`${this.prefix}`, loginRequest);
  }

  isUserLoggedIn(): boolean {
    if (localStorage.getItem('token')) {
      const token = localStorage.getItem('token') as string;
      const decrypt = CryptoJS.AES.decrypt(token, 'token');
      return this.isJson(decrypt.toString(CryptoJS.enc.Utf8));
    }
    return false;
  }

  getToken(): string {
    const token = localStorage.getItem('token') as string;
    const decrypt = CryptoJS.AES.decrypt(token, 'token');
    return decrypt.toString(CryptoJS.enc.Utf8);
  }

  setToken(token: string): void {
    const encrypted = CryptoJS.AES.encrypt(token, 'token').toString();
    localStorage.setItem('token', encrypted);
  }

  isJson(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}



/*
* filename: login.component.ts
* reason: To handle business logic of login
* */

import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {LoginRequestModel, LoginResponseModel} from "../../../core/models";
import {AuthService} from "../services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  loginInProcess = false;
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  processLogin(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      const loginRequest: LoginRequestModel = {
        email: formData.email,
        password: formData.password
      }
      this.loginInProcess = true;
      this.authService.processLogin(loginRequest).subscribe((loginResponse: LoginResponseModel) => {
        this.loginInProcess = false;
        if (loginResponse.token) {
          this.authService.setToken(loginResponse.token);
          this.router.navigate(['employee']).then(null);
        }
      })
    }
  }
}


/*
* filename: login.component.html
* reason: to display login form
* */
<form [formGroup]="loginForm" (submit)="processLogin()">
  Email*: <input type="email" formControlName="email" >
  <span [class.color]="'w3-red'" *ngIf="loginForm.get('email')?.hasError('required')">Email is required</span>
  <span [class.color]="'w3-red'" *ngIf="loginForm.get('email')?.hasError('email')">Email is not valid</span>
  <br>
  Password*: <input type="password" formControlName="password">
  <span [class.color]="'red'" *ngIf="loginForm.get('password')?.hasError('required')">Password is required</span><br>
  <button type="submit" [disabled]="loginInProcess">Submit</button>
</form>



/*
* filename: employee.module.ts
* reason: to handle employee components, services
*/

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



/*
* filename: employee-routing.module.ts
* reason: to handle employee routing
*/

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



/*
* filename: employee.service.ts
* reason: to provide process employee components
*/
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



/*
* filename: display.component.ts
* reason: to manage employee display business logic
*/

import { Component, OnInit } from '@angular/core';
import {map, Observable} from "rxjs";
import {EmployeeModel} from "../../../core/models";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {
  employees$: Observable<EmployeeModel[]> = new Observable<EmployeeModel[]>();

  constructor(
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.employees$ = this.activatedRoute.data.pipe(map((data) => {
      if (data['employees'].length && !!data['employees']){
        return data['employees'];
      }
      return [];
    }));
  }

}




/*
* filename: display.component.html
* reason: to view employee data
*/

<div *ngVar="(employees$ | async) as employees">
  <table>
    <tr>
      <th>
        Name
      </th>
      <th>
        Email
      </th>
    </tr>
    <tr *ngFor="let employee of employees">
      <td>
        {{employee.firstName + employee.lastName}}
      </td>
      <td>
        {{employee.email}}
      </td>
    </tr>
  </table>
</div>
