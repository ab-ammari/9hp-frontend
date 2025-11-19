import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {CsvBuilder} from "../../../util/csv-builder";
import {LOG, LoggerContext} from "ngx-wcore";
import {ToastService} from "../../../services/toast.service";
import {CastorListDownloadHelperService} from "../../../services/castor-list-download-helper.service";

const CONTEXT: LoggerContext = {
  origin: 'CastorBtnCsvDownload'
}

@Component({
  selector: 'app-castor-btn-csv-downloader',
  templateUrl: './castor-btn-csv-downloader.component.html',
  styleUrls: ['./castor-btn-csv-downloader.component.scss']
})
export class CastorBtnCsvDownloaderComponent implements OnInit {

  @Input() table: ApiDbTable;
  list_to_download: Array<Map<string, string>> = [];

  objects: Array<dbBoundObject<ApiSyncableObject>>;

  private csvBuilder = new CsvBuilder(this.toastService);
  Array = Array;

  categories: Array<string> = [];
  selected_categories: Set<string> = new Set<string>();

  constructor(private w: WorkerService, private toastService: ToastService, public helper: CastorListDownloadHelperService) {
  }

  ngOnInit(): void {
    this.categories = this.helper?.getCategories(this.table);
    this.categories?.forEach(c => this.selected_categories.add(c));
  }

  downloadCsv() {
    LOG.debug.log({...CONTEXT, action: 'downloadCsv'}, this.list_to_download)
    this.csvBuilder.convertObjectsToCSV(this.helper.getCompiledList(this.table, this.selected_categories), this.selected_categories, this.table);
  }

  toggleValue(key: string) {
    if (this.selected_categories.has(key)){
      this.selected_categories.delete(key);
    } else {
      this.selected_categories.add(key);
    }
  }

}
