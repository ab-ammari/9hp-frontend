import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FaitFormComponent} from "./fait-form/fait-form.component";
import {IonicModule} from "@ionic/angular";
import {InputsModule} from "../Inputs/inputs.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {GeneralityFormComponent} from "./generality-form/generality-form.component";
import {DimensionsFormComponent} from "./dimensions-form/dimensions-form.component";
import {AltitudeFormComponent} from "./altitude-form/altitude-form.component";
import {UsFormComponent} from "./us-form/us-form.component";
import {UsPositiveFormComponent} from "./us-positive-form/us-positive-form.component";
import {UsConstruiteFormComponent} from "./us-construite-form/us-construite-form.component";
import {DisplayModule} from "../Display/display.module";
import {MobilierFormComponent} from "./mobilier-form/mobilier-form.component";
import {PrelevementFormComponent} from "./prelevement-form/prelevement-form.component";
import {SecteurFormComponent} from "./secteur-form/secteur-form.component";
import {ProjetFormComponent} from "./projet-form/projet-form.component";
import {ContenantFormComponent} from "./contenant-form/contenant-form.component";
import {EnsembleFormComponent} from "./ensemble-form/ensemble-form.component";
import {SondageFormComponent} from "./sondage-form/sondage-form.component";
import {MinuteFormComponent} from "./minute-form/minute-form.component";
import {PhotoFormComponent} from "./photo-form/photo-form.component";
import {TopoFormComponent} from "./topo-form/topo-form.component";
import {StratigraphieFormComponent} from "./stratigraphie-form/stratigraphie-form.component";
import {UsSousDivisonsFormComponent} from "./us-sous-divisons-form/us-sous-divisons-form.component";
import {SondageCoupeListFormComponent} from "./sondage-coupe-list-form/sondage-coupe-list-form.component";
import {LinkedEnsembleFormComponent} from "./linked-ensemble-form/linked-ensemble-form.component";
import {MinuteLinkFormComponent} from "./minute-link-form/minute-link-form.component";
import {MatIconModule} from "@angular/material/icon";
import {MatDividerModule} from "@angular/material/divider";
import {FicheFormComponent} from "./fiche-form/fiche-form.component";
import {PipesModule} from "../../pipe/pipes.module";
import {FaitSectionLinkFormComponent} from "./fait-section-link-form/fait-section-link-form.component";
import { NewFaitFormComponent } from './new-fait-form/new-fait-form.component';
import { NewContenantFormComponent } from './new-contenant-form/new-contenant-form.component';
import { NewEnsembleFormComponent } from './new-ensemble-form/new-ensemble-form.component';
import { NewMinuteFormComponent } from './new-minute-form/new-minute-form.component';
import { NewMobilierFormComponent } from './new-mobilier-form/new-mobilier-form.component';
import { NewPhotoFormComponent } from './new-photo-form/new-photo-form.component';
import { NewPrelevementFormComponent } from './new-prelevement-form/new-prelevement-form.component';
import { NewSondageFormComponent } from './new-sondage-form/new-sondage-form.component';
import { NewTopoFormComponent } from './new-topo-form/new-topo-form.component';
import { NewUsFormComponent } from './new-us-form/new-us-form.component';
import { NewLinkFormComponent } from './new-link-form/new-link-form.component';
import {DirectiveModule} from "../../directive/directive.module";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatCardModule} from "@angular/material/card";
import {MatListModule} from "@angular/material/list";
import { UsNegativeFormComponent } from './us-negative-form/us-negative-form.component';
import { JointsFormComponent } from './us-construite-form/joints-form/joints-form.component';
import { MouluresFormComponent } from './us-construite-form/moulures-form/moulures-form.component';
import { RemploisFormComponent } from './us-construite-form/remplois-form/remplois-form.component';
import { AppareilFormComponent } from './us-construite-form/appareil-form/appareil-form.component';
import { AssisesFormComponent } from './us-construite-form/assises-form/assises-form.component';
import { FourrureBlocageFormComponent } from './us-construite-form/fourrure-blocage-form/fourrure-blocage-form.component';
import { ConstruiteNegatifsFormComponent } from './us-construite-form/construite-negatifs-form/construite-negatifs-form.component';
import { LiantFormComponent } from './us-construite-form/liant-form/liant-form.component';
import { TracesTailleFormComponent } from './us-construite-form/traces-taille-form/traces-taille-form.component';
import { MarquesLapidairesFormComponent } from './us-construite-form/marques-lapidaires-form/marques-lapidaires-form.component';



// @ts-ignore
@NgModule({
  declarations: [
    /* Object forms */
    ProjetFormComponent,
    SecteurFormComponent,
    FaitFormComponent,
    UsFormComponent,
    UsPositiveFormComponent,
    UsNegativeFormComponent,
    UsConstruiteFormComponent,
    UsSousDivisonsFormComponent,
    StratigraphieFormComponent,
    MobilierFormComponent,
    PrelevementFormComponent,
    ContenantFormComponent,
    EnsembleFormComponent,
    SondageFormComponent,
    SondageCoupeListFormComponent,
    MinuteFormComponent,
    PhotoFormComponent,
    TopoFormComponent,
    LinkedEnsembleFormComponent,
    /* Other forms */
    GeneralityFormComponent,
    DimensionsFormComponent,
    AltitudeFormComponent,
    MinuteLinkFormComponent,
    FaitSectionLinkFormComponent,
    FicheFormComponent,
    /* Creation form */
    NewFaitFormComponent,
    NewContenantFormComponent,
    NewEnsembleFormComponent,
    NewMinuteFormComponent,
    NewMobilierFormComponent,
    NewPhotoFormComponent,
    NewPrelevementFormComponent,
    NewSondageFormComponent,
    NewTopoFormComponent,
    NewUsFormComponent,
    /* New link form */
    NewLinkFormComponent,
    JointsFormComponent,
    MouluresFormComponent,
    RemploisFormComponent,
    AppareilFormComponent,
    AssisesFormComponent,
    FourrureBlocageFormComponent,
    ConstruiteNegatifsFormComponent,
    LiantFormComponent,
    TracesTailleFormComponent,
    MarquesLapidairesFormComponent,
  ],
  exports: [
    ProjetFormComponent,
    SecteurFormComponent,
    FaitFormComponent,
    UsFormComponent,
    MobilierFormComponent,
    PrelevementFormComponent,
    ContenantFormComponent,
    EnsembleFormComponent,
    SondageFormComponent,
    MinuteFormComponent,
    PhotoFormComponent,
    TopoFormComponent,
    MinuteLinkFormComponent,
    FaitSectionLinkFormComponent,
    NewFaitFormComponent,
    NewContenantFormComponent,
    NewEnsembleFormComponent,
    NewMinuteFormComponent,
    NewMobilierFormComponent,
    NewPhotoFormComponent,
    NewPrelevementFormComponent,
    NewSondageFormComponent,
    NewTopoFormComponent,
    NewUsFormComponent,
    NewLinkFormComponent,
  ],
    imports: [
        CommonModule,
        IonicModule,
        InputsModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        DisplayModule,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatDividerModule,
        PipesModule,
        MatListModule,
        DirectiveModule
    ]
})
export class FormModule { }
