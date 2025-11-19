import {Injectable} from '@angular/core';
import {WorkerService} from "./worker.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {dbBoundObject} from "../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiEchantillon, ApiFait, ApiSecteur, ApiSyncableObject, ApiUs} from "../../../shared";
import {dbBoundObjectList} from "../DataClasses/models/db-bound-object-list";
import {getTableDescription, tableDescription} from "../DataClasses/models/sync-obj-utilities";
import {dbBoundLinkList} from "../DataClasses/models/db-bound-link-list";
import {castorObjectOrder} from "../util/cator-object-order";
import {dbBoundLink} from "../DataClasses/models/db-bound-link";
import {reference} from "@popperjs/core";


const CONTEXT: LoggerContext = {
  origin: 'CastorObjectContextService'
}

@Injectable({
  providedIn: 'root'
})


export class CastorObjectContextService {


  constructor(private w: WorkerService) {
    LOG.debug.log({...CONTEXT, action: 'constructor'});

  }

  ObjectLinkContext(object: dbBoundObject<ApiSyncableObject> ) {
    let availableApiLinkSelections = new Set<LinkSelection>([]);
    this.objectDirectLinks(object.info.ref_table).forEach(link => {
      if (link.info.parentType && link.info.ref_table !== ApiDbTable.us) { // exception for us because all children are used in same list
        link.info.child_tables.forEach(child => {
          availableApiLinkSelections.add({
            type: 'direct',
            id: child,
            label: child.replace(link.info.ref_table + '_', ''),
            direct_objects: link,
            info: getTableDescription(child)
          });
        });
      } else {
        availableApiLinkSelections.add({
          type: 'direct',
          id: link.info.uuid_paths[1] ? link.info.uuid_paths[1].split('_')[1] : link.object.table,
          label: (link.info.uuid_paths[1] ? link.info.uuid_paths[1].split('_')[1] : link.object.table),
          direct_objects: link,
          info: link.info
        });
      }
    });

    this.w.data().links.list.forEach(link => {
      if (link.info.ref_table.includes(object.info.ref_table)) {
        const target_info = getTableDescription(link.info.ref_table
          .replace('link_', '')
          .replace(object.info.ref_table, '')
          .replace('_', '') as ApiDbTable)
        LOG.debug.log({...CONTEXT, action: 'add Link'}, link, target_info);
        if (target_info.parentType && target_info.ref_table !== ApiDbTable.us) {
          LOG.debug.log({...CONTEXT, action: 'add Link'}, link);
          target_info.child_tables.forEach(child => {
            availableApiLinkSelections.add({
              type: 'link',
              id: child,
              label: child.replace(target_info.ref_table, '').replace('_', ''),
              links: link.all,
              info: getTableDescription(child),
              link_info: link.info
            });
          });
        } else {
          availableApiLinkSelections.add({
            type: 'link',
            id: target_info.obj_table,
            label: link.info.label.replace('_', '').replace(object.info.ref_table, ''),
            links: link.all,
            info: getTableDescription(target_info.obj_table),
            link_info: link.info
          });
        }
      }
    });

    //sort links
    return new Set(
      Array.from(availableApiLinkSelections).sort((a, b) => {
        if (castorObjectOrder.indexOf(b.info.obj_table) > castorObjectOrder.indexOf(a.info.obj_table)) {
          return -1;
        } else if (castorObjectOrder.indexOf(b.info.obj_table) < castorObjectOrder.indexOf(a.info.obj_table)) {
          return 1;
        } else {
          return 0;
        }
      }).map(item => {
        item.count = this.countLinks(item, object);
        return item;
      })
    );
  }

   objectDirectLinks(target: ApiDbTable): Array<dbBoundObjectList<ApiSyncableObject>>{
    switch (target) {
      case ApiDbTable.fait:
        return [this.w.data().objects.us.all];
      case ApiDbTable.secteur:
        return [this.w.data().objects.fait.all, this.w.data().objects.us.all, this.w.data().objects.echantillon.all];
      case ApiDbTable.us:
        return [this.w.data().objects.echantillon.all];
      case ApiDbTable.section:
        return [this.w.data().objects.echantillon.all];
      default:
        return [];
    }
  }


  private countLinks(target: LinkSelection, reference: dbBoundObject<ApiSyncableObject>): number {
    let count = 0;
    if (target.type === 'link') {
      let link_list: LinkList;
      const ref_uuid = reference.uuid_path;
      const target_uuid = target.info.uuid_paths[0];
      link_list = {
        target: target.info,
        relation: target.link_info,
        reference: reference.info,
        list: []
      };
      LOG.debug.log({...CONTEXT, action: 'target.links?.list?.filter('}, {ref_uuid, target_uuid});
      target.links?.list?.filter(
        item => {
          return item.item[ref_uuid] === reference.uuid;
        }
      ).forEach(link => {
        LOG.debug.log({...CONTEXT, action: 'forEach'}, target_uuid, target.info.ref_table);

        const target_obj: dbBoundObject<ApiSyncableObject>
          = this.w.data().objects[target.info.ref_table].all.findByUuid(link.item[target_uuid]);
        if (target_obj &&
          (target_obj.info.obj_table === target.info.obj_table
          || (target_obj.info.ref_table === ApiDbTable.us && target_obj.info.ref_table === target.info.ref_table))
        ) {
          link_list.list.push({
            relation: link,
            reference: reference,
            target: target_obj
          });
        } else {
          LOG.warn.log({...CONTEXT, action: 'countLinks', message: 'could not get obj for some reason'}, target_obj);
        }
      });
      LOG.debug.log({...CONTEXT, action: 'countLinks'}, link_list);
      count = link_list.list.length;
    } else {
      const link_us_list: Array<dbBoundObject<ApiUs>> = [];
      if (reference.info.ref_table === ApiDbTable.secteur) {
        link_us_list.push(...this.w.data().objects.us.all.list
          .filter(us => us.item.secteur_uuid === (reference.item as ApiSecteur).secteur_uuid));
      } else if (reference.info.ref_table === ApiDbTable.fait) {
        link_us_list.push(...this.w.data().objects.us.all.list
          .filter(us => us.item.fait_uuid === (reference.item as ApiFait).fait_uuid));
      } else if (reference.info.ref_table === ApiDbTable.section) {
        //s
      } else {
        LOG.warn.log({...CONTEXT, action: 'generateList', message: 'HOW did you get here ???'}, reference, target, reference.info);
      }

      let bound_list = target.direct_objects.list.filter(item => {
        if ([ApiDbTable.secteur, ApiDbTable.fait].includes(reference.info.ref_table) && item.info.ref_table === ApiDbTable.echantillon) {
          return link_us_list.some(us => us.item.us_uuid === (item.item as ApiEchantillon).us_uuid);
        } else {
          return (item.info.obj_table === target.info.obj_table || (target.info.parentType && target.info.child_tables.includes(item.info.obj_table)))
            && item.item[reference.info.uuid_paths[0]] === reference.item[reference.info.uuid_paths[0]]
        }
      });
      count = bound_list.length;
    }

    return count;
  }

}

export interface LinkSelection {
  type: 'direct' | 'link',
  id: string,
  label: string,
  count?: number,
  info?: tableDescription, // target object info
  direct_objects?: dbBoundObjectList<ApiSyncableObject>, /// list of objects containing direct links
  links?: dbBoundLinkList<ApiSyncableObject>, // Relevant LINKS
  link_info?: tableDescription // info but for link
}

export interface LinkTriplet {
  relation: dbBoundLink<ApiSyncableObject>,
  reference: dbBoundObject<ApiSyncableObject>,
  target: dbBoundObject<ApiSyncableObject>
}
export interface LinkList {
  list: Array<LinkTriplet>
  relation: tableDescription,
  reference: tableDescription,
  target: tableDescription
}
