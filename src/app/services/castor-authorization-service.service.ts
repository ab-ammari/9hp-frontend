import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { ApiStratigraphie } from '../../../shared';

@Injectable({
  providedIn: 'root'
})
export class CastorAuthorizationService {

  constructor(private w: WorkerService) { }

  /**
   * verify if the current user can delete the given stratigraphy
   * @param stratigraphy the stratigraphy to verify
   * @returns true if the user can delete the stratigraphy, false otherwise
   */
  canDeleteRelation(stratigraphy : ApiStratigraphie): boolean {
    const isAuthor = this.w.data().user?.user_uuid === stratigraphy.author_uuid;
    const isOwner = this.w.data().isOwner;

    return isAuthor || isOwner;
  }

  /**
   * a generic method to verify if the current user is the author of the given object
   * @param createdBy the user uuid of the object to verify
   * @returns true if the current user is the author of the object, false otherwise
   */
  isCreatedBy(createdBy: string): boolean {
    return this.w.data().user?.user_uuid === createdBy;
  }

  /**
   * verify if the current user is the owner of the actuall project
   * @returns true if the current user is the owner of the project, false otherwise
   */
  isProjectOwner(): boolean {
    return this.w.data().isOwner;
  }

}
