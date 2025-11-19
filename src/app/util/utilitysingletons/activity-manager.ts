import {catchError, Observable, Subject, throwError} from "rxjs";
import {v4 as uuidv4} from "uuid";
import {tap} from "rxjs/operators";

export interface ToastMessage {
  text: string;
  type: 'error' | 'info' | 'success';
}

class ActivityManager {

  static A: ActivityManager = new ActivityManager();

  private tasks: Set<string> = new Set<string>();


  get ongoingTasks(): boolean {
    return this.tasks.size > 0;
  }

  private messages: Subject<ToastMessage> = new Subject<ToastMessage>();

  get onNewMessage(): Observable<ToastMessage> {
    return this.messages.asObservable();
  }

  constructor() {
    if (ActivityManager.A) {
      return ActivityManager.A;
    }
  }

  public publish(message: ToastMessage){
    this.messages.next(message);
  }

  public taskIsOngoing(uuid: string): boolean {
    return this.tasks.has(uuid);
  }


 public trackProgress<T>(obs: Observable<T>,uuid: string = uuidv4()): Observable<T> {
    this.tasks.add(uuid);
   return obs.pipe(
     catchError((error) => {
       this.tasks.delete(uuid);
       this.publish({
         text: error,
         type: 'error'
       });
       return throwError(() => error);
     }),
     tap(() => {
       this.tasks.delete(uuid);
     }));
 }
}

export const Manager: ActivityManager = ActivityManager.A;
