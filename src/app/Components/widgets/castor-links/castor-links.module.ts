import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CastorLinksComponent} from './castor-links.component';
import {IonicModule} from "@ionic/angular";
import {DirectLinkDisplayComponent} from './direct-link-components/direct-link-display/direct-link-display.component';
import {
  DirectLinkListUsDisplayComponent
} from "./direct-link-components/direct-link-list-us-display/direct-link-list-us-display.component";
import {
  DirectLinkListFaitDisplayComponent
} from "./direct-link-components/direct-link-list-fait-display/direct-link-list-fait-display.component";
import {
  DirectLinkListEnsembleDisplayComponent
} from "./direct-link-components/direct-link-list-ensemble-display/direct-link-list-ensemble-display.component";
import {
  DirectLinkListSectionDisplayComponent
} from "./direct-link-components/direct-link-list-section-display/direct-link-list-section-display.component";
import {
  DirectLinkListMobilierDisplayComponent
} from "./direct-link-components/direct-link-list-mobilier-display/direct-link-list-mobilier-display.component";
import {
  DirectLinkListPrelevementDisplayComponent
} from "./direct-link-components/direct-link-list-prelevement-display/direct-link-list-prelevement-display.component";
import {
  DirectLinkListMinuteDisplayComponent
} from "./direct-link-components/direct-link-list-minute-display/direct-link-list-minute-display.component";
import {
  DirectLinkListPhotoDisplayComponent
} from "./direct-link-components/direct-link-list-photo-display/direct-link-list-photo-display.component";
import {
  DirectLinkListTopoDisplayComponent
} from "./direct-link-components/direct-link-list-topo-display/direct-link-list-topo-display.component";
import {CastorLinkComponent} from './link-components/castor-link/castor-link.component';
import {FormsModule} from "@angular/forms";
import {CastorLinkListComponent} from "./link-components/castor-link/castor-link-list/castor-link-list.component";
import {
  CastorLinkDocumentFaitListDisplayComponent
} from './link-components/castor-link/CastorLinkListDisplay/castor-link-document-fait-list-display/castor-link-document-fait-list-display.component';
import {
  CastorLinkTopoFaitListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-fait-list-display/castor-link-topo-fait-list-display.component";
import {
  CastorLinkSectionFaitListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-section-fait-list-display/castor-link-section-fait-list-display.component";
import {
  CastorLinkSectionEnsembleListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-section-ensemble-list-display/castor-link-section-ensemble-list-display.component";
import {
  CastorLinkEnsembleDocumentListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-ensemble-document-list-display/castor-link-ensemble-document-list-display.component";
import {
  CastorLinkEnsembleFaitListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-ensemble-fait-list-display/castor-link-ensemble-fait-list-display.component";
import {
  CastorLinkEnsembleUsListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-ensemble-us-list-display/castor-link-ensemble-us-list-display.component";
import {
  CastorLinkSectionUsListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-section-us-list-display/castor-link-section-us-list-display.component";
import {
  CastorLinkDocumentUsListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-document-us-list-display/castor-link-document-us-list-display.component";
import {
  CastorLinkDocumentSectionListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-document-section-list-display/castor-link-document-section-list-display.component";
import {
  CastorLinkDocumentEchantillonListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-document-echantillon-list-display/castor-link-document-echantillon-list-display.component";
import {
  CastorLinkTopoUsListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-us-list-display/castor-link-topo-us-list-display.component";
import {
  CastorLinkTopoSectionListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-section-list-display/castor-link-topo-section-list-display.component";
import {
  CastorLinkTopoEnsembleListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-ensemble-list-display/castor-link-topo-ensemble-list-display.component";
import {
  CastorLinkTopoEchantillonListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-echantillon-list-display/castor-link-topo-echantillon-list-display.component";
import {
  CastorLinkTopoDocumentListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-topo-document-list-display/castor-link-topo-document-list-display.component";
import {
  CastorLinkContenantEchantillonListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-contenant-echantillon-list-display/castor-link-contenant-echantillon-list-display.component";
import {
  CastorLinkSecteurGpsListDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/castor-link-secteur-gps-list-display/castor-link-secteur-gps-list-display.component";
import {
  CastorLinkDocumentTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-document-table-display/castor-link-document-table-display.component";
import {
  CastorLinkTopoTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-topo-table-display/castor-link-topo-table-display.component";
import {
  CastorLinkSectionTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-section-table-display/castor-link-section-table-display.component";
import {
  CastorLinkEchantillonTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-echantillon-table-display/castor-link-echantillon-table-display.component";
import {
  CastorLinkFaitTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-fait-table-display/castor-link-fait-table-display.component";
import {
  CastorLinkUsTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-us-table-display/castor-link-us-table-display.component";
import {
  CastorLinkContenantTableDisplayComponent
} from "./link-components/castor-link/CastorLinkListDisplay/CastorLinkTable/castor-link-contenant-table-display/castor-link-contenant-table-display.component";
import {DisplayModule} from "../../Display/display.module";
import {FormModule} from "../../Form/form.module";
import {MatIconModule} from "@angular/material/icon";

@NgModule({
  declarations: [
    CastorLinksComponent,
    DirectLinkDisplayComponent,
    /* DIRECT LINK list item display */
    DirectLinkListUsDisplayComponent,
    DirectLinkListFaitDisplayComponent,
    DirectLinkListEnsembleDisplayComponent,
    DirectLinkListSectionDisplayComponent,
    DirectLinkListMobilierDisplayComponent,
    DirectLinkListPrelevementDisplayComponent,
    DirectLinkListMinuteDisplayComponent,
    DirectLinkListPhotoDisplayComponent,
    DirectLinkListTopoDisplayComponent,
    /* Castor LINK */
    CastorLinkListComponent,
    CastorLinkComponent,
    CastorLinkDocumentFaitListDisplayComponent,
    CastorLinkTopoFaitListDisplayComponent,
    CastorLinkSectionFaitListDisplayComponent,
    CastorLinkSectionEnsembleListDisplayComponent,
    CastorLinkEnsembleDocumentListDisplayComponent,
    CastorLinkEnsembleFaitListDisplayComponent,
    CastorLinkEnsembleUsListDisplayComponent,
    CastorLinkSectionUsListDisplayComponent,
    CastorLinkDocumentUsListDisplayComponent,
    CastorLinkDocumentSectionListDisplayComponent,
    CastorLinkDocumentEchantillonListDisplayComponent,
    CastorLinkTopoUsListDisplayComponent,
    CastorLinkTopoSectionListDisplayComponent,
    CastorLinkTopoEnsembleListDisplayComponent,
    CastorLinkTopoEchantillonListDisplayComponent,
    CastorLinkTopoDocumentListDisplayComponent,
    CastorLinkContenantEchantillonListDisplayComponent,
    CastorLinkSecteurGpsListDisplayComponent,
    /* Castor link table */
    CastorLinkDocumentTableDisplayComponent,
    CastorLinkTopoTableDisplayComponent,
    CastorLinkSectionTableDisplayComponent,
    CastorLinkEchantillonTableDisplayComponent,
    CastorLinkFaitTableDisplayComponent,
    CastorLinkUsTableDisplayComponent,
    CastorLinkContenantTableDisplayComponent,
  ],
  exports: [
    CastorLinksComponent,
    DirectLinkListTopoDisplayComponent
  ],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        DisplayModule,
        FormModule,
        MatIconModule
    ]
})
export class CastorLinksModule {
}
