import { Component, OnInit } from '@angular/core';
import {ConfigurationService} from "../../../services/configuration.service";
import {DEV} from "../../../util/dev";
import {DB} from "../../../Database/DB";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {DataActions} from "../../../../../shared/actions/data-actions";
import {
  ApiDbExchanceStatus,
  ApiDbExchange,
  ApiDbExchangeType,
  ApiSyncable,
  ApiSyncableType
} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {Manager} from "../../../util/utilitysingletons/activity-manager";
import {CastorSyncService} from "../../../services/castor-sync.service";
import Dexie from 'dexie';
import {AlertController} from '@ionic/angular';
import {castor_schema, session_schema} from '../../../Database/schema';

const CONTEXT: LoggerContext = {
  origin: 'DevToolsInterfaceComponent'
}



@Component({
  selector: 'app-dev-tools-interface',
  templateUrl: './dev-tools-interface.component.html',
  styleUrls: ['./dev-tools-interface.component.scss']
})
export class DevToolsInterfaceComponent implements OnInit {

  customUrl: string = localStorage.getItem('customapi');
  showStratiIcon: boolean = localStorage.getItem('showStratiIcon') === 'true';
  enableStratiValidation: boolean = localStorage.getItem('enableStratiValidation') !== 'false'; // Activé par défaut
  autoStratiValidation: boolean = localStorage.getItem('autoStratiValidation') === 'true'; // Désactivé par défaut

  DEV = DEV;
  constructor(
    private config: ConfigurationService,
    private w: WorkerService,
    public syncService: CastorSyncService,
    private alertController: AlertController
  ) { }

  ngOnInit(): void {

  }

  toggleStratiIcon() {
    localStorage.setItem('showStratiIcon', this.showStratiIcon.toString());
  }

  toggleStratiValidation() {
    localStorage.setItem('enableStratiValidation', this.enableStratiValidation.toString());
    if (!this.enableStratiValidation) {
      // Si on désactive la validation, désactiver aussi l'auto
      this.autoStratiValidation = false;
      localStorage.setItem('autoStratiValidation', 'false');
    }
  }

  toggleAutoStratiValidation() {
    localStorage.setItem('autoStratiValidation', this.autoStratiValidation.toString());
  }

  save() {
    localStorage.setItem('customapi', this.customUrl);
    location.reload();
  }

  reset() {
    localStorage.removeItem('customapi');
    location.reload();
  }

  resetDB() {
    DB.database.Armageddon();
  }

  exportTypes() {
    DB.database.type.dexie_table.toArray().then(list => {
      LOG.info.log('Basic types :', list);
    });
  }

  async updateTypes() {
    const types = await DB.database.type.dexie_table.filter((t) => t.projet_uuid === null).toArray();

   this.w.network(DataActions.SYNC_OBJECT, {
      errorIfAlreadySave: false,
      list: types.map(item => {
        return {
          data: item,
          action: ApiDbExchangeType.CREATE,
          status: ApiDbExchanceStatus.request
        } as ApiDbExchange<ApiSyncable>;
      })
    }).pipe(
      tap(response => {
        LOG.debug.log({...CONTEXT, action: 'updateTypes'}, response);
      })
    ).subscribe();

  }

  protected readonly Manager = Manager;

  async exportDatabase() {
    try {
      LOG.info.log({...CONTEXT, action: 'exportDatabase'}, 'Starting database export');

      // Export both databases
      const refData = await this.exportDexieDatabase('REF');
      const sessionData = await this.exportDexieDatabase('SESSION');

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        databases: {
          REF: refData,
          SESSION: sessionData
        }
      };

      // Generate filename with date, time and user name
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const userName = DB.database.user_session?.user?.user_first_name || DB.database.user_session?.user?.user_email || 'unknown';
      const userSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);
      const filename = `castor-db-export-${dateStr}-${timeStr}-${userSlug}.json`;

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      LOG.info.log({...CONTEXT, action: 'exportDatabase'}, 'Export completed successfully', filename);
      await this.showAlert('Export réussi', 'La base de données a été exportée avec succès.');
    } catch (error) {
      LOG.error.log({...CONTEXT, action: 'exportDatabase'}, error);
      await this.showAlert('Erreur d\'export', 'Une erreur est survenue lors de l\'export de la base de données.');
    }
  }

  private async exportDexieDatabase(dbName: string): Promise<any> {
    const db = new Dexie(dbName);
    await db.open();

    const tables: any = {};
    for (const table of db.tables) {
      tables[table.name] = await table.toArray();
    }

    db.close();
    return tables;
  }

  async importDatabase() {
    const alert = await this.alertController.create({
      header: 'Attention !',
      message: 'Cette action va <strong>écraser toutes les données</strong> de la base de données locale. Cette opération est irréversible. Voulez-vous continuer ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Continuer',
          role: 'confirm',
          handler: () => {
            this.selectAndImportFile();
          }
        }
      ]
    });

    await alert.present();
  }

  private selectAndImportFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const importData = JSON.parse(text);
          await this.performImport(importData);
        } catch (error) {
          LOG.error.log({...CONTEXT, action: 'importDatabase'}, error);
          await this.showAlert('Erreur d\'import', 'Le fichier sélectionné n\'est pas valide ou est corrompu.');
        }
      }
    };
    input.click();
  }

  private async performImport(importData: any) {
    try {
      LOG.info.log({...CONTEXT, action: 'performImport'}, 'Starting database import');

      if (!importData.databases || !importData.databases.REF || !importData.databases.SESSION) {
        throw new Error('Invalid import data structure');
      }

      // Delete existing databases
      await Dexie.delete('REF');
      await Dexie.delete('SESSION');

      // Import REF database
      await this.importDexieDatabase('REF', importData.databases.REF);

      // Import SESSION database
      await this.importDexieDatabase('SESSION', importData.databases.SESSION);

      LOG.info.log({...CONTEXT, action: 'performImport'}, 'Import completed successfully');
      await this.showAlert('Import réussi', 'La base de données a été importée avec succès. L\'application va redémarrer.');

      // Reload the application
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (error) {
      LOG.error.log({...CONTEXT, action: 'performImport'}, error);
      await this.showAlert('Erreur d\'import', 'Une erreur est survenue lors de l\'import de la base de données.');
    }
  }

  private async importDexieDatabase(dbName: string, tables: any): Promise<void> {
    const db = new Dexie(dbName);

    // Use the correct schema based on database name
    const schema = dbName === 'REF' ? castor_schema : session_schema;

    // Setup database with proper schema - use version 4 for REF (like castordb.ts), version 1 for SESSION
    const version = dbName === 'REF' ? 4 : 1;
    db.version(version).stores(schema);

    await db.open();

    // Import data into each table
    for (const tableName in tables) {
      const tableData = tables[tableName];
      if (Array.isArray(tableData) && tableData.length > 0) {
        LOG.debug.log({...CONTEXT, action: 'importDexieDatabase', message: `Importing ${tableData.length} records into ${tableName}`});
        try {
          await db.table(tableName).bulkPut(tableData);
        } catch (error) {
          LOG.error.log({...CONTEXT, action: 'importDexieDatabase', message: `Error importing table ${tableName}`}, error);
          throw error;
        }
      }
    }

    db.close();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
