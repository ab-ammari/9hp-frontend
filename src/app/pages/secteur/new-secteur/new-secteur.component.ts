import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {Location} from "@angular/common";
import {
  ApiDbTable,
  ApiSecteur,
  ApiSyncableObject,
  ApiSyncableType,
  ApiTypeCategory,
  ApiUser,
  TagSystem
} from "../../../../../shared";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-secteur',
  templateUrl: './new-secteur.component.html',
  styleUrls: ['./new-secteur.component.scss']
})
export class NewSecteurComponent implements OnInit {

  secteurType: ApiSyncableType;
  responsable: ApiUser;


  constructor(public w: WorkerService, private location: Location) { }

  ngOnInit(): void {
  }

  createNewSecteur() {
    const sector: ApiSecteur = {
      created: null,
      live: true,
      projet_uuid: this.w.data()?.projet?.selected.item?.projet_uuid,
      secteur_uuid: null,
      responsable: this.responsable.user_uuid,
      table: ApiDbTable.secteur, // OBLIGATORY dans tout les objets !!
      tag: null,
      author_uuid: this.w.data()?.user?.user_uuid,
      versions: [],
      secteur_type: this.secteurType.type_uuid
    }
    console.log('newSector', sector);
    this.w.data().objects.secteur.selected.commit(sector).subscribe(() => {
      this.goBack();
    });
  }

  goBack() {
    this.location.back();
  }

    protected readonly ApiTypeCategory = ApiTypeCategory;
}
