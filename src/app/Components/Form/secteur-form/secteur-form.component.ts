import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from "@angular/common";
import {ApiDbTable, ApiFait, ApiSecteur, ApiUser} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {debounceTime, map, takeUntil, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {Observable, of, Subject, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";

const CONTEXT: LoggerContext = {
  origin: 'SecteurFormComponent'
}

@Component({
  selector: 'app-secteur-form',
  templateUrl: './secteur-form.component.html',
  styleUrls: ['./secteur-form.component.scss']
})
export class SecteurFormComponent implements OnInit, OnDestroy {

  @Input() secteur: ApiSecteur;

  @Input() unSaveForm: boolean;
  @Output() unSaveFormChange = new EventEmitter();

  private formChange$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  responsable: ApiUser;

  constructor(
              public w: WorkerService
  ) {
  }
  readonly hook: SelectionHook<ApiSecteur> = {
    id: v4(),
    callback: change => {
      return this.onSave().pipe(
        map(result => change)
      );
    }
  };
  ngOnInit(): void {
    this.w.data().objects.secteur.addHook(this.hook);
    this.initForm();
    
    // Sauvegarde automatique avec debounce
    this.formChange$.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$),
      tap(() => this.saveFormValue().subscribe())
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.w.data().objects.secteur.removeHook(this.hook);
    this.saveFormValue().subscribe();
  }

  initForm() {
    LOG.debug.log({
      ...CONTEXT,
      action: 'get User'
    }, this.responsable, this.w.data().projet.selected?.item?.users, this.secteur);
    this.responsable = this.w.data().projet.selected?.item?.users?.find(user => user.user_uuid === this.secteur?.responsable);
    LOG.debug.log({
      ...CONTEXT,
      action: 'get User'
    }, this.responsable, this.w.data().projet.selected?.item?.users, this.secteur);
  }

  onSave() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected.item?.projet_uuid) {
      return this.saveFormValue();
    } else {
      LOG.debug.log({
        ...CONTEXT,
        action: 'onSave'
      }, this.w.data()?.user?.user_uuid, this.w.data()?.projet?.selected.item?.projet_uuid);
      return of(undefined);
    }
  }

  saveFormValue() {
    if (this.secteur?.secteur_uuid) {
      this.secteur.responsable = this.responsable?.user_uuid;
      this.secteur.author_uuid = this.w.data()?.user?.user_uuid;
      console.log('update sector', this.secteur);
      return this.w.data().objects.secteur.selected.commit(this.secteur).pipe(tap(() => {
        this.unSaveForm = false;
        this.unSaveFormChange.emit(false);
      }));
    } else {
      return of(undefined);
    }
  }

  onChangeForm() {
    if (this.unSaveForm) {
      return;
    } else {
      this.unSaveForm = true;
      this.unSaveFormChange.emit(true);
      // Déclencher la sauvegarde automatique
      this.formChange$.next();
    }
  }



}
