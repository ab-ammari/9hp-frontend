import {getDateNow, download, bool2num} from "./utils";
import {ToastService} from "../services/toast.service";
import {ApiDbTable} from "../../../shared";

export class CsvBuilder {

  constructor(private toastService: ToastService ) {
  }

  convertObjectsToCSV(valueToDisplay: Array<Map<string, string>> = [] , categories: Set<string>, table: ApiDbTable) {
    try {
      let str = "";
      let row = "";

      /* CSV Header */
      categories.forEach((value) => {
        row += value + ';';
      });
      row = row.slice(0, -1);
      /* New line */
      str += row + "\r\n";


      /* Create Lines */
      valueToDisplay.forEach((value) => {
        let line: string = "";
        categories.forEach(item => {
          // Delete all carriage return
          let valueGetted = value.get(item);
          valueGetted = valueGetted.replace(/\r?\n|\r/g, " ");
          valueGetted = valueGetted.replace(/;+/g, ",");
          line +=  valueGetted + ';';
        });
        line = line.slice(0, -1);
        str += line + '\r\n';
      });

      /* Get time now*/
      const strDate = getDateNow();
      const fileName: string = strDate + '_' + table + '_list' + '.csv';
      const csvData: string = "\ufeff" + str;
      const blobType: string = "text/csv;charset=utf-8;";
      download(csvData, fileName, blobType);
    } catch (e) {
      this.toastService.error('Erreur', 'Erreur à l\'export du CSV');
      throw(e);
    }
  }

}
