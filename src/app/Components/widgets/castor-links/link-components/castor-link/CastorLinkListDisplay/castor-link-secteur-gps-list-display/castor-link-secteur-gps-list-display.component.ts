import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiGps, ApiLinkSecteurGps, ApiSecteur} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-secteur-gps-list-display',
  templateUrl: './castor-link-secteur-gps-list-display.component.html',
  styleUrls: ['./castor-link-secteur-gps-list-display.component.scss']
})
export class CastorLinkSecteurGpsListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkSecteurGps>, secteur: dbBoundObject<ApiSecteur>, gps: dbBoundObject<ApiGps> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkSecteurGps>,
        secteur: this.extractobject(ApiDbTable.secteur, relation) as dbBoundObject<ApiSecteur>,
        gps: this.extractobject(ApiDbTable.gps, relation) as dbBoundObject<ApiGps>
      })
    });
  }

}
