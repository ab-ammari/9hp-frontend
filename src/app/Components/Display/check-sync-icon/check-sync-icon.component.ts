import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-check-sync-icon',
  templateUrl: './check-sync-icon.component.html',
  styleUrls: ['./check-sync-icon.component.scss']
})
export class CheckSyncIconComponent implements OnInit {
  @Input() test: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
