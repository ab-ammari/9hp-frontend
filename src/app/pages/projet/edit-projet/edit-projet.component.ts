import { Component, OnInit, OnDestroy } from '@angular/core';
import {WorkerService} from "../../../services/worker.service";

@Component({
  selector: 'app-edit-projet',
  templateUrl: './edit-projet.component.html',
  styleUrls: ['./edit-projet.component.scss']
})
export class EditProjetComponent implements OnInit, OnDestroy {

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }
}
