import {NgModule, Optional, SkipSelf} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WCoreService} from './CoreServices/w-core.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [WCoreService],
  exports: []
})
export class CoreModule {


  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only');
    }

  }

  forRoot() {

  }

}
