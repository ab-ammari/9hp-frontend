import {Directive, HostBinding, Input} from '@angular/core';
import {NavigationEnd, Router, RouterEvent} from "@angular/router";
import {LOG, LoggerContext} from "ngx-wcore";


const CONTEXT: LoggerContext = {
  origin: 'LinkDirective'
};

@Directive({
  selector: '[appLinkActive]'
})
export class LinkActiveDirective {

  @Input() url: string;

  @HostBinding('class') elementClass = '';

  constructor(private router: Router) {
    console.log("contain url link active ?", this.router.url, this.url);
    if (this.router.url.includes(this.url)) {
      this.elementClass = 'active-link';
    }
    this.router.events.subscribe((event) => {

      if (event instanceof NavigationEnd) {
        LOG.debug.log({...CONTEXT, action: 'NavigationEnd link directive'}, event, this.url);
        LOG.debug.log({...CONTEXT, action: 'include link url'}, event.url.includes(this.url));
        if (event.url.includes(this.url)) {
          this.elementClass = 'active-link'
        } else {
          this.elementClass = '';
        }
      }
    });
  }
}
