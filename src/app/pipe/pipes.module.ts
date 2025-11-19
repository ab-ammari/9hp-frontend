import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SortBy2FieldsPipe} from "./sort-by2-fields/sort-by2-fields.pipe";
import {FilterByIdPipe} from "./filterById/filter-by-id.pipe";
import {FilterPipe} from "./filter/filter.pipe";
import {LengthPipe} from "./length/length.pipe";
import {SortBy1FieldPipe} from "./sort-by1-field/sort-by1-field.pipe";
import {GetFaitsBySecteurPipe} from "./getFaitsBySecteur/get-faits-by-secteur.pipe";
import {StartsWithPipe} from "./startsWith/starts-with.pipe";
import {FilterByIdEnsPipe} from "./filterByIdEns/filter-by-id-ens.pipe";
import {FilterIdentifPipe} from "./filterIdentif/filter-identif.pipe";
import {SearchPipe} from "./search/search.pipe";
import {FilterByUniteIdPipe} from "./filterByUniteId/filter-by-unite-id.pipe";
import {FilterBySondageIdPipe} from "./filterBySondageId/filter-by-sondage-id.pipe";
import {FilterByUniteAndSondageIdPipe} from "./filterByUniteAndSondageId/filter-by-unite-and-sondage-id.pipe";
import {FilterByUniteAndMinuteIdPipe} from "./filterByUniteAndMinuteId/filter-by-unite-and-minute-id.pipe";
import {FilterLinkPipe} from "./filterLink/filter-link.pipe";
import {SortPipe} from "./sort/sort.pipe";
import {ApiProjectOwner, ApiUserPipe} from './api-user.pipe';
import { CastorTagPipe } from './castor-tag.pipe';
import { ApiUSPipe } from './api-us.pipe';
import {ApiSecteurPipe} from "./api-secteur.pipe";
import {ApiSondagePipe} from "./api-sondage.pipe";
import {SectorSynthesePipe} from "./sector-synthese.pipe";
import { ContenantContenuPipe } from './contenant-contenu.pipe';
import { DimensionPipePipe } from './dimension-pipe.pipe';
import {TruncatePipe} from "./truncate.pipe";



@NgModule({
    declarations: [
        FilterPipe,
        LengthPipe,
        SortBy1FieldPipe,
        SortBy2FieldsPipe,
        GetFaitsBySecteurPipe,
        FilterByIdPipe,
        StartsWithPipe,
        FilterByIdEnsPipe,
        FilterIdentifPipe,
        SearchPipe,
        FilterByUniteIdPipe,
        FilterBySondageIdPipe,
        FilterByUniteAndSondageIdPipe,
        FilterByUniteAndMinuteIdPipe,
        FilterLinkPipe,
        SortPipe,
        ApiUserPipe,
        CastorTagPipe,
        ApiUSPipe,
        ApiSecteurPipe,
        ApiSondagePipe,
        SectorSynthesePipe,
        ContenantContenuPipe,
        DimensionPipePipe,
        TruncatePipe,
        ApiProjectOwner,
    ],
  imports: [
    CommonModule
  ],
    exports: [
        FilterPipe,
        LengthPipe,
        SortBy1FieldPipe,
        SortBy2FieldsPipe,
        GetFaitsBySecteurPipe,
        FilterByIdPipe,
        StartsWithPipe,
        FilterByIdEnsPipe,
        FilterIdentifPipe,
        SearchPipe,
        FilterByUniteIdPipe,
        FilterBySondageIdPipe,
        FilterByUniteAndSondageIdPipe,
        FilterByUniteAndMinuteIdPipe,
        FilterLinkPipe,
        SortPipe,
        ApiUserPipe,
        CastorTagPipe,
        ApiUSPipe,
        ApiSecteurPipe,
        ApiSondagePipe,
        SectorSynthesePipe,
        ContenantContenuPipe,
        DimensionPipePipe,
        TruncatePipe,
        ApiProjectOwner,
    ]
})
export class PipesModule { }
