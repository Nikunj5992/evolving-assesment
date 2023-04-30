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
