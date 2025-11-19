import {BehaviorSubject, Observable, Subject} from "rxjs";
import {ApiIQ} from "wcore-shared";

export class SocketBuffer {

  private buffer: BehaviorSubject<Array<ApiIQ<unknown, unknown>>>
    = new BehaviorSubject<Array<ApiIQ<unknown, unknown>>>([]);

  push(iq: ApiIQ<unknown, unknown>, subject: Subject<ApiIQ<unknown, unknown>>) {
    const buffer = this.buffer.value;
    subject.error('Couldn\'t send. saving in buffer to try again later');
    subject.complete();
    buffer.push(iq);
    this.buffer.next(buffer);
  }

  pop(): ApiIQ<unknown, unknown> {
    const buffer = this.buffer.value;
    const item = buffer.pop();
    this.buffer.next(buffer);
    return item;
  }

  count(): number {
    return this.buffer?.value?.length;
  }

  forEach(callback: (item: ApiIQ<unknown, unknown>) => void) {
    const buffer = this.buffer.value;
    buffer.forEach((i, index) => {
      callback(i);
      buffer.splice(index, 1);
    });
    this.buffer.next(buffer);
  }

  asObservable(): Observable<Array<ApiIQ<unknown, unknown>>> {
    return this.buffer.asObservable();
  }

}

