import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {dbBoundObjectList} from "./db-bound-object-list";
import {dbBoundObject} from "./db-bound-object";
import {BehaviorSubject, combineLatest, concat, merge, Observable, of, OperatorFunction, Subject} from "rxjs";
import {dbObject} from "../../Database/db-object";
import {LOG, LoggerContext} from "ngx-wcore";
import {DB, dbStatus} from "../../Database/DB";
import {concatMap, filter, map, mergeMap, skip, takeUntil, tap} from "rxjs/operators";
import {UI} from "../../util/ui";
import {getTableDescription, tableDescription} from "./sync-obj-utilities";
import {concatMapTo} from "rxjs-compat/operator/concatMapTo";

const CONTEXT: LoggerContext = {
  origin: 'castorAbstractDataClass'
};

export interface SelectionChange<T extends ApiSyncableObject> {
  current: dbBoundObject<T>,
  candidate: dbBoundObject<T>
}

export interface SelectionHook<T extends ApiSyncableObject> {
  id: string;
  callback: (change: SelectionChange<T>) => Observable<SelectionChange<T>>;
}

export abstract class castorAbstractObjectDataClass<T extends ApiSyncableObject> {
  all: dbBoundObjectList<T>;
  private _selected: dbBoundObject<T>;

  get selected() {
    return this._selected;
  }
  select(selection: dbBoundObject<T>): Observable<SelectionChange<T>> {
    const update: BehaviorSubject<SelectionChange<T>> = new BehaviorSubject<SelectionChange<T>>({candidate: selection, current: this.selected});
    const operators: OperatorFunction<SelectionChange<T>, any>[] = this.preSelectionHooks.map((hook) => mergeMap((value: SelectionChange<T>) => hook.callback(value)));
    LOG.debug.log({...CONTEXT, action: 'select(selection: dbBoundObject'}, update,operators);
    // @ts-ignore
    return update.pipe(...operators, tap({
      next: (value: SelectionChange<T>) => {
        LOG.debug.log({...CONTEXT, action: 'next: (value: SelectionChange'}, value);
        this._selected = value.candidate;
      }
    }));
  }

  private preSelectionHooks: Array<SelectionHook<T>> = [];
  addHook(hook: SelectionHook<T>) {
      const index = this.preSelectionHooks.findIndex(h => h.id === hook.id);
      if (index !== -1) {
        this.preSelectionHooks[index] = hook;
      } else {
        this.preSelectionHooks.push(hook);
      }
  }
  removeHook(hook: SelectionHook<T>) {
    this.preSelectionHooks = this.preSelectionHooks.filter(h => h.id !== hook.id);
  }

  isFirstObject: boolean = false;
  isLastObject: boolean = false;

  private $subscriber: Subject<boolean> = new Subject<boolean>();


  public get isInit(): boolean {
    return this._isInit.value;
  }

  public get onInit(): Observable<boolean> {
    return this._isInit.asObservable();
  }

  get isReady() {
    return this.all.isReady && this.selected && this.selected.isReady;
  }
  onReady(): Observable<boolean> {
    return combineLatest(
      [
        this.all.onReady,
        this.selected
          ? this.selected.onReady
          : this.onInit.pipe(concatMap(() => this.selected.onReady))
      ]
    ).pipe(
      filter(([all, selected]) => all && selected),
      map(val => true)
    );
  }

  private _isInit: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  protected abstract get db(): dbObject<T>;

  protected readonly info: tableDescription;

  protected constructor(
    public table: ApiDbTable,
  ) {
    this.info = getTableDescription(table);
    DB.database.status.pipe(filter(value => value === dbStatus.ready)).subscribe(next => {
      this.init();
    });
  }

   init() {
     this._isInit.next(false);
    this.$subscriber.next(undefined);
    this.all = new dbBoundObjectList<T>(this.db, this.info);

    this.select(new dbBoundObject<T>(this.db, this.info.obj_table)).pipe(
      tap(() => {
        LOG.debug.log({...CONTEXT, action: 'init'}, this.db);
        LOG.debug.log({...CONTEXT, action: 'init'}, this.info.obj_table);
        LOG.debug.log({...CONTEXT, action: 'init'}, this.selected);
        this.selected.select(UI.state.getState(this.info.uuid_paths[0]));
        this.selected.onValueChange().pipe(
          takeUntil(this.$subscriber), //reset if init is called again
          skip(2) // because it's a behaviour subject we skip the first value
        ).subscribe(value => {
          //LOG.debug.log({...CONTEXT, action: 'this.selected.onValueChange()'}, this.db.uuid_path, value);
          this.checkIsLastOrFirstOfList(value);
          UI.state.setState(this.info.uuid_paths[0], (value ? value[this.info.uuid_paths[0]] : null));
        });
        this.setDefault();
        this._isInit.next(true);
        LOG.debug.log({...CONTEXT, action: 'init'}, this.info);
      })
    ).subscribe();

  }

  public selectNext() {
    this.move('ahead');
  }
  public selectPrevious() {
    this.move('back');
  }

  private move(direction: 'ahead' | 'back') {
    const uuid_paths = this.info.uuid_paths[0];
    // Child list case
    if (['echantillon', 'document'].includes(this.info.ref_table)) {
      this.moveInListWithIndex(direction, this.all.childList(this.selected?.info?.obj_table), uuid_paths);
    } else {
      this.moveInListWithIndex(direction, this.all.list, uuid_paths);
    }
  }

  moveInListWithIndex(direction: string, list: Array<dbBoundObject<T>>, uuid_paths: string) {
    const index = this.getObjectIndex(list, uuid_paths);
    LOG.debug.log({...CONTEXT, action: 'moveInListWithIndex'}, {direction, list, uuid_paths, index})
    if (direction === 'back' && index > 0 && index <= list.length - 1) {
      this.select(list[index - 1]).subscribe();
    } else if (direction === 'ahead' && index >= 0 && index < list.length - 1){
      this.select(list[index + 1]).subscribe();
    } else {
      // no item found or end of list
      LOG.error.log({...CONTEXT, action: 'private move(ahead: boolean)', message: ' didn\'t work !!!!!'}, {
        direction,
        list,
        uuid_paths,
        index
      });
    }
  }

  getObjectIndex(list: Array<dbBoundObject<T>>, uuid_paths: string) {
    LOG.debug.log({...CONTEXT, action: 'getObjectIndex'}, {list, uuid_paths}, this.selected);
    return list?.findIndex(
      (value, index, obj) => {
        return (value.item[uuid_paths] === this.selected.item[uuid_paths]);
      });
  }

  checkIsLastOrFirstOfList(item: ApiSyncableObject) {
    if (item?.table) {
      const uuid_paths = this.info.uuid_paths[0];
      if (['echantillon', 'document'].includes(this.info.ref_table)) {
        this.setFirstLastBool(this.all.childList(this.selected?.info?.obj_table), uuid_paths)
      } else {
        this.setFirstLastBool(this.all.list, uuid_paths)
      }
    }

  }

  setFirstLastBool(list: Array<dbBoundObject<T>>, uuid_paths: string) {
    const index = this.getObjectIndex(list, uuid_paths);
    if (typeof index === 'undefined' ) {
      return;
    }
    if (list?.length === 1) {
      // There is one object in the list
      this.isLastObject = true;
      this.isFirstObject = true;
      return;
    }
    if (index === list?.length -1) {
      this.isFirstObject = false;
      this.isLastObject = true;
    } else if (index === 0) {
      this.isLastObject = false;
      this.isFirstObject = true;
    } else {
      // It is not the first or last
      this.isLastObject = false;
      this.isFirstObject = false;
    }
  }

  abstract setDefault();

}

