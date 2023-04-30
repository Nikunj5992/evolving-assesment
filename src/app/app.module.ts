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
