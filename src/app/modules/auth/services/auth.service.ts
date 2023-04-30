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
