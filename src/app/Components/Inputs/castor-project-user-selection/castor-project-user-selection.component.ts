import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiUser} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";

@Component({
  selector: 'app-castor-project-user-selection',
  templateUrl: './castor-project-user-selection.component.html',
  styleUrls: ['./castor-project-user-selection.component.scss']
})
export class CastorProjectUserSelectionComponent implements OnInit {

  @Input() user: ApiUser;
  @Output() userChange = new EventEmitter<ApiUser>();

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
  }

}
