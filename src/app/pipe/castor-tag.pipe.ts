import {Pipe, PipeTransform} from '@angular/core';
import {ApiSyncableObject} from "../../../shared";

@Pipe({
  name: 'castorTag'
})
export class CastorTagPipe implements PipeTransform {

  transform(value: ApiSyncableObject, ...args: unknown[]): HTMLElement {
    let result: HTMLElement = new HTMLElement();
    let msg: string = '';
    if (value['tag']) {
      msg = value['tag'];
    }

    if (value.draft) {
      msg = '<i>' + msg + '</i>';
    }

    if (value.error) {
      msg = '<u>' + msg + '</u>'
    }
    if (!value.live) {
      msg = '<del>' + msg + '</del>';
    }
    result.innerHTML = msg;
    return result;
  }

}

interface TagObject extends ApiSyncableObject {
  tag: string;
}
