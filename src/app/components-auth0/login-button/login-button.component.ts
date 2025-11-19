import {Component, OnInit} from '@angular/core';
import {AuthService} from '@auth0/auth0-angular';
import {WorkerService} from "../../services/worker.service";

@Component({
  selector: 'app-login-button',
  templateUrl: './login-button.component.html',
  styles: [],
})
export class LoginButtonComponent implements OnInit {

  constructor(
    public w: WorkerService,
    public auth: AuthService
  ) {
  }

  ngOnInit(): void {
  }

  loginWithRedirect(): void {
    this.auth.loginWithRedirect();
  }

  loginWithRedirect2(): void {
    this.auth.loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  }

}
