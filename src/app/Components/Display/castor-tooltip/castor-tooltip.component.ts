import {Component, OnInit, ViewChild} from '@angular/core';
import {v4, v4 as uuidv4} from "uuid";
import {IonPopover, PopoverController} from "@ionic/angular";
import {BehaviorSubject, Subject, timer} from "rxjs";
import {debounce, takeUntil, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'CastorTooltipComponent'
}

@Component({
  selector: 'app-castor-tooltip',
  templateUrl: './castor-tooltip.component.html',
  styleUrls: ['./castor-tooltip.component.scss']
})
export class CastorTooltipComponent implements OnInit {

  id: string = v4();
  @ViewChild('tagPopover') tagPopover: IonPopover;
  buttonHasMouse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  contentHasMouse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  popoverIsVisible: boolean = false;

  $subscriber: Subject<any> = new Subject();

  constructor(public popover: PopoverController) { }

  ngOnInit(): void {

    this.contentHasMouse.pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(500)),
      tap(() => {
        this.popoverIsVisible = (this.contentHasMouse.value || this.buttonHasMouse.value);
        this.togglePopover();
      })
    ).subscribe();
    this.buttonHasMouse.pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(250)),
      tap(() => {
        this.popoverIsVisible = (this.contentHasMouse.value || this.buttonHasMouse.value);
        this.togglePopover();
      })
    ).subscribe();

  }

  togglePopover(){
    if (this.tagPopover) {
      if (this.popoverIsVisible) {
        if (this.tagPopover.isOpen){
          // already open
        } else {
          this.tagPopover.present();
        }
      } else {
        if (this.tagPopover.isOpen){
          this.tagPopover.dismiss();
        } else {
          // already closed
        }
      }
    } else {
      LOG.debug.log({...CONTEXT, action: 'toggle popover', message: 'Doesn\'t exist yet ?'}, this.popover);
    }
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

}
