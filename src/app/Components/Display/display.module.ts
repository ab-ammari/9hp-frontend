import {NgModule} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ItemsDetailsTabsMenuComponent} from "./items-details-tabs-menu/items-details-tabs-menu.component";
import {DateDisplayComponent} from "./date-display/date-display.component";
import {IonicModule} from "@ionic/angular";
import {MatLegacyTabsModule as MatTabsModule} from "@angular/material/legacy-tabs";
import {DraftStatusItemComponent} from "./draft-status-item/draft-status-item.component";
import {ProjetDisplayCardComponent} from './ProjetDisplayCard/projet-display-card.component';
import {CastorItemsListComponent} from "./castor-items-list/castor-items-list.component";
import {
  CastorRowItemSecteurComponent
} from "./CastorTypedItem/castor-row-item-secteur/castor-row-item-secteur.component";
import {CastorRowItemFaitComponent} from "./CastorTypedItem/castor-row-item-fait/castor-row-item-fait.component";
import {CastorRowItemUsComponent} from "./CastorTypedItem/castor-row-item-us/castor-row-item-us.component";
import {
  CastorRowItemEnsembleComponent
} from "./CastorTypedItem/castor-row-item-ensemble/castor-row-item-ensemble.component";
import {
  CastorRowItemSectionComponent
} from "./CastorTypedItem/castor-row-item-sondage/castor-row-item-section.component";
import {
  CastorRowItemMobilierComponent
} from "./CastorTypedItem/castor-row-item-mobilier/castor-row-item-mobilier.component";
import {
  CastorRowItemPrelevementComponent
} from "./CastorTypedItem/castor-row-item-prelevement/castor-row-item-prelevement.component";
import {
  CastorRowItemContenantComponent
} from "./CastorTypedItem/castor-row-item-contenant/castor-row-item-contenant.component";
import {CastorRowItemMinuteComponent} from "./CastorTypedItem/castor-row-item-minute/castor-row-item-minute.component";
import {CastorRowItemPhotoComponent} from "./CastorTypedItem/castor-row-item-photo/castor-row-item-photo.component";
import {CastorRowItemTopoComponent} from "./CastorTypedItem/castor-row-item-topo/castor-row-item-topo.component";
import {StratigraphieListDisplayComponent} from "./stratigraphie-list-display/stratigraphie-list-display.component";
import {MatLegacyCardModule as MatCardModule} from "@angular/material/legacy-card";
import {GenericContentTableComponent} from './generic-content-table/links/generic-content-table.component';
import {HeadbandTownDisplayComponent} from "./headband-town-display/headband-town-display.component";
import {HeadbandItemHeaderComponent} from "./headband-item-header/headband-item-header.component";
import {CastorTypeDisplayComponent} from './castor-type-display/castor-type-display.component';
import { CastorTagDisplayComponent } from './castor-tag-display/castor-tag-display.component';
import { CastorTooltipComponent } from './castor-tooltip/castor-tooltip.component';
import { CastorUserItemDisplayComponent } from './castor-user-item-display/castor-user-item-display.component';
import {PipesModule} from "../../pipe/pipes.module";
import { CastorSyncObjInfoComponent } from './castor-sync-obj-info/castor-sync-obj-info.component';
import { GenericContentObjectTableComponent } from './generic-content-table/objects/generic-content-object-table.component';
import {FormsModule} from "@angular/forms";
import { CastorFileDisplayComponent } from './castor-file-display/castor-file-display.component';
import {AccessGuardModule} from "../widgets/access-guard/access-guard.module";
import { GenericLinkedObjectTagListComponent } from './generic-linked-object-tag-list/generic-linked-object-tag-list.component';
import {MatIconModule} from "@angular/material/icon";
import {MatLegacyTooltipModule as MatTooltipModule} from "@angular/material/legacy-tooltip";
import {MobilierDatationDisplayComponent} from "./mobilier-datation-display/mobilier-datation-display.component";
import {CastorSectorInfoDisplayComponent} from "./castor-sector-info-display/castor-sector-info-display.component";
import {
  CastorGenericObjectInfoDisplayComponent
} from "./castor-generic-object-info-display/castor-generic-object-info-display.component";
import {DirectiveModule} from "../../directive/directive.module";
import {MatLegacyListModule as MatListModule} from "@angular/material/legacy-list";
import {
  CastorGenericLinkEditButtonComponent
} from "./castor-generic-object-info-display/castor-generic-link-edit-button/castor-generic-link-edit-button.component";
import { CastorStratigraphieVisualizationComponent } from './castor-stratigraphie-visualization/castor-stratigraphie-visualization.component';
import {ScrollingModule} from "@angular/cdk/scrolling";
import { GenericDocumentTableComponent } from './generic-document-table/generic-document-table.component';
import { CastorSyncProgressDisplayComponent } from './castor-sync-progress-display/castor-sync-progress-display.component';
import {CastorBtnCsvDownloaderModule} from "../widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";
import { CastorImageGalleryComponent } from './castor-image-gallery/castor-image-gallery.component';

import {DeboucedInitContentComponent} from "../widgets/debouced-init-content/debouced-init-content.component";
import { GenericContentObjectTableRowComponent } from './generic-content-table/objects/generic-content-object-table-row/generic-content-object-table-row.component';
import { CastorZoomContainerComponent } from './castor-zoom-container/castor-zoom-container.component';


@NgModule({
  declarations: [
    ItemsDetailsTabsMenuComponent,
    DateDisplayComponent,
    DraftStatusItemComponent,
    ProjetDisplayCardComponent,
    CastorItemsListComponent,
    /* Castor row item */
    CastorRowItemSecteurComponent,
    CastorRowItemFaitComponent,
    CastorRowItemUsComponent,
    CastorRowItemEnsembleComponent,
    CastorRowItemSectionComponent,
    CastorRowItemMobilierComponent,
    CastorRowItemPrelevementComponent,
    CastorRowItemContenantComponent,
    CastorRowItemMinuteComponent,
    CastorRowItemPhotoComponent,
    CastorRowItemTopoComponent,
    /* End row item*/
    StratigraphieListDisplayComponent,
    GenericContentTableComponent,
    HeadbandTownDisplayComponent,
    HeadbandItemHeaderComponent,
    CastorTypeDisplayComponent,
    CastorTagDisplayComponent,
    CastorTooltipComponent,
    CastorUserItemDisplayComponent,
    CastorSyncObjInfoComponent,
    GenericContentObjectTableComponent,
    CastorFileDisplayComponent,
    GenericLinkedObjectTagListComponent,
    MobilierDatationDisplayComponent,
    CastorSectorInfoDisplayComponent,
    CastorGenericObjectInfoDisplayComponent,
    CastorGenericLinkEditButtonComponent,
    CastorStratigraphieVisualizationComponent,
    GenericDocumentTableComponent,
    CastorSyncProgressDisplayComponent,
    CastorImageGalleryComponent,
    CastorZoomContainerComponent,
    DeboucedInitContentComponent,
    GenericContentObjectTableRowComponent,
  ],
    exports: [
        ItemsDetailsTabsMenuComponent,
        DateDisplayComponent,
        DraftStatusItemComponent,
        ProjetDisplayCardComponent,
        CastorItemsListComponent,
        StratigraphieListDisplayComponent,
        GenericContentTableComponent,
        HeadbandTownDisplayComponent,
        HeadbandItemHeaderComponent,
        CastorTypeDisplayComponent,
        CastorTooltipComponent,
        CastorUserItemDisplayComponent,
        CastorSyncObjInfoComponent,
        CastorTagDisplayComponent,
        GenericContentObjectTableComponent,
        CastorFileDisplayComponent,
        CastorSectorInfoDisplayComponent,
        CastorGenericLinkEditButtonComponent,
        CastorSyncProgressDisplayComponent,
        CastorZoomContainerComponent,
        DeboucedInitContentComponent,
    ],
    imports: [
        CommonModule,
        IonicModule,
        MatTabsModule,
        MatCardModule,
        PipesModule,
        FormsModule,
        AccessGuardModule,
        MatIconModule,
        MatTooltipModule,
        DirectiveModule,
        MatListModule,
        ScrollingModule,
        NgOptimizedImage,
        CastorBtnCsvDownloaderModule
    ]
})
export class DisplayModule {
}
