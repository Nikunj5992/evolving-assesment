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
