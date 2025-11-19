import {AfterViewInit, Component, Input, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Subject, timer} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";

@Component({
  selector: 'app-debouced-init-content',
  templateUrl: './debouced-init-content.component.html',
  styleUrls: ['./debouced-init-content.component.scss']
})
export class DeboucedInitContentComponent implements OnInit, OnDestroy, AfterViewInit {
  show: boolean = false;

  @Input() debounceTime: number = 0;

  private destroyer$: Subject<void> = new Subject();
  constructor(private zone: NgZone) {
  }

  ngOnInit(): void {

  }
  ngOnDestroy() {
    this.destroyer$.next();
  }
  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      timer(this.debounceTime).pipe(
        takeUntil(this.destroyer$),
        tap(() => this.show = true)
      ).subscribe();
    })

  }
}
