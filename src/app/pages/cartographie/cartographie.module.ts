import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CartographieRoutingModule } from './cartographie-routing.module';

// Composants
import { CartographieComponent } from './cartographie.component';
import { MapContainerComponent } from './components/map-container/map-container.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';

// Services
import { MapService } from './services/map.service';
import { GmlParserService } from './services/gml-parser.service';
import { ProjectionService } from './services/projection.service';

@NgModule({
  declarations: [
    CartographieComponent,
    MapContainerComponent,
    ToolbarComponent,
    StatusBarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CartographieRoutingModule
  ],
  providers: [
    MapService,
    GmlParserService,
    ProjectionService
  ]
})
export class CartographieModule { }
