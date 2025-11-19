import {Component, OnInit, OnDestroy} from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { UserService } from "../../../services/user.service";
import {WorkerService} from "../../../services/worker.service";

import {Observable, of, Subject} from "rxjs";
import {ConfirmationService} from "../../../services/confirmation.service";
import {showUnSaveDialog} from "../../../util/utils";
import {getSectorColors} from "../../../util/castor-object-color-schemes";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";

@Component({
  selector: 'app-details-secteur',
  templateUrl: './details-secteur.component.html',
  styleUrls: ['./details-secteur.component.scss']
})
export class DetailsSecteurComponent implements OnInit, OnDestroy,  OnDestroy {

  protected readonly getSectorColors = getSectorColors;


  constructor(private formBuilder: UntypedFormBuilder,
              public w: WorkerService,
              private route: ActivatedRoute,
              private router: Router,
              private userService : UserService,
              private location: Location,
              private confirmationService: ConfirmationService, public utils: CastorUtilitiesService) { }


  ngOnInit(): void {
  }


  ngOnDestroy() {
  }

}
