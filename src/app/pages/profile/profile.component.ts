import {Component, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiUser} from "../../../../shared";
import {WUtils} from "ngx-wcore";
import {UserActions} from "../../../../shared/actions/user-actions";
import {tap} from "rxjs/operators";
import {DB} from "../../Database/DB";
import {Location} from "@angular/common";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: ApiUser;

  constructor(public w: WorkerService, public location: Location) {
  }

  ngOnInit(): void {
    this.user = WUtils.deepCopy(this.w.data().user);
  }

  saveProfile() {
    this.w.network(UserActions.UPDATE_USER, this.user).pipe(
      tap((value) => {
        if (value.payload) {
          DB.database.user_session.user = value.payload;
        }
      })
    ).subscribe((next) => {
      this.location.back();
    });
  }

}
