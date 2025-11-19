import {Component, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {A} from "../../Core-event";
import {ApiSynchroFrontInterfaceEnum} from "../../../../shared";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  constructor(
    public w: WorkerService
  ) {
  }

  ngOnInit(): void {
  }

  goToProfileConfig() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROFILE})
  }

  goToProjectsPage() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_LIST})
  }

  goToParams() {

  }
}
