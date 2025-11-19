import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiEnsemble} from "../../../../../shared";

@Component({
  selector: 'app-linked-ensemble-form',
  templateUrl: './linked-ensemble-form.component.html',
  styleUrls: ['./linked-ensemble-form.component.scss']
})
export class LinkedEnsembleFormComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
