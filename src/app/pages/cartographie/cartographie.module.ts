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

// Phase 2 - Nouveaux composants
import { LayerPanelComponent } from './components/layer-panel/layer-panel.component';
import { LegendComponent } from './components/legend/legend.component';
import { BaseMapSelectorComponent } from './components/base-map-selector/base-map-selector.component';

// Services
import { MapService } from './services/map.service';
import { GmlParserService } from './services/gml-parser.service';
import { ProjectionService } from './services/projection.service';

// Phase 2 - Nouveaux services
import { LayerService } from './services/layer.service';
import { StyleService } from './services/style.service';

@NgModule({
  declarations: [
    CartographieComponent,
    MapContainerComponent,
    ToolbarComponent,
    StatusBarComponent,
    // Phase 2
    LayerPanelComponent,
    LegendComponent,
    BaseMapSelectorComponent
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
    ProjectionService,
    // Phase 2
    LayerService,
    StyleService
  ]
})
export class CartographieModule { }