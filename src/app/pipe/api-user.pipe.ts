import {Pipe, PipeTransform} from '@angular/core';
import {validate} from "uuid";
import {WorkerService} from "../services/worker.service";
import {ApiProjet, ApiUser} from "../../../shared";
import {tap} from "rxjs/operators";

@Pipe({
  name: 'apiUser'
})
export class ApiUserPipe implements PipeTransform {
  users: Array<ApiUser>;

  constructor(w: WorkerService) {
    w.data().projet.selected.onValueChange().pipe(
      tap(value => this.users = value?.users)
    ).subscribe();
  }

  transform(value: string, ...args: unknown[]): string {
    if (validate(value) && this.users?.length > 0) {
      const user: ApiUser = this.users.find(user => user.user_uuid === value);
      if (user) {
        return user.user_first_name + ' ' + user.user_last_name;
      }
    }
    return '_';
  }

}

@Pipe({
  name: 'apiProjectOwner'
})
export class ApiProjectOwner implements PipeTransform {

  constructor() {}

  transform(value: ApiProjet, ...args: unknown[]): string {
    const owner = value?.users?.find(u => u.user_uuid === value?.owner_uuid);
    return owner ?( owner.user_first_name + ' ' + owner.user_last_name ): '';
  }

}
