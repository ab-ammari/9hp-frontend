import {Component, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {AuthService} from "@auth0/auth0-angular";
import {UI} from "../../util/ui";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-authentication-button',
  templateUrl: './authentication-button.component.html',
  styles: [],
})
export class AuthenticationButtonComponent implements OnInit {

  constructor(public w: WorkerService, private auth: AuthService, private user: UserService) {
  }

  ngOnInit(): void {
  }

  logout(): void {
    this.user.logout();
  }
}
