import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {DB} from "../../Database/DB";
import {Subject} from "rxjs";
import {debounceTime, takeUntil, tap} from "rxjs/operators";
import {NetworkStatus} from "ngx-wcore";


@Component({
  selector: 'app-page-navigation-wrapper',
  templateUrl: './page-navigation-wrapper.component.html',
  styleUrls: ['./page-navigation-wrapper.component.scss']
})
export class PageNavigationWrapperComponent implements OnInit, OnDestroy {

  loading: boolean = true;

  $subscriber: Subject<boolean> = new Subject<boolean>();
  NetworkStatus = NetworkStatus;
  constructor(
    public w: WorkerService,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.loading = !DB.database.user_session.readyState.value;
    DB.database.user_session.readyState.pipe(
      takeUntil(this.$subscriber),
      debounceTime(100),
      tap((value) => {
        this.zone.run(() => {
          this.loading = !value;
        });
      })
    ).subscribe()
  }
  ngOnDestroy() {
    this.$subscriber.next(true);
  }

}
