import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../../services/worker.service";

@Component({
  selector: 'app-castor-stratigraphie-visualization',
  templateUrl: './castor-stratigraphie-visualization.component.html',
  styleUrls: ['./castor-stratigraphie-visualization.component.scss']
})
export class CastorStratigraphieVisualizationComponent implements OnInit {


  orderedList: Array<{
    items: Set<string>,
    status: string,
  }>;

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.generateOrderedList();
  }


  generateOrderedList() {
    this.w.data().objects.stratigraphie.all.list
        .map(s => s.item)
        .filter(item => item.live) // discard deleted objects
        .filter(val => val) /// remove null objects
        .forEach(s => {
          // check if already in timeline
          if (s.is_contemporain) {
            const uuids = [s.us_anterieur, s.fait_anterieur, s.fait_posterieur, s.us_posterieur].filter(x => x);
            const index = this.orderedList.map(
                moment => {
                  if (uuids.some( uuid => moment.items.has(uuid) )) {

                  }
                }
            );

          } else {

          }



        });
  }


}
