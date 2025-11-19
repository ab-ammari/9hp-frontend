import {defer, from, Observable} from "rxjs";
import {share, switchMap, timeout} from "rxjs/operators";

export class RestApi {

  constructor(private apiUrl: string, private apiKey?: string) {
  }

  isOnline(): boolean {
    return window.navigator.onLine;
  }

  post(body: unknown, path: string = 'action'): Observable<unknown> {
    return defer(() => from(fetch(this.apiUrl + path, {
      method: 'POST',
      body: JSON.stringify(body), // string or object
      headers: {
        Authorization: this.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    }))).pipe(
      timeout(30000),
      share(),
      switchMap((response: Response) => response?.json()));
  }
  get( path: string): Observable<unknown> {
    return defer(() => from(fetch(this.apiUrl + path, {
      method: 'GET',
      headers: {
        Authorization: this.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    }))).pipe(
      timeout(30000),
      share(),
      switchMap((response: Response) => response?.json()));
  }


}
