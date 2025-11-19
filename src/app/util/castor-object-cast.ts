import {
  ApiDbTable,
  ApiDocument,
  ApiEnsemble,
  ApiFait,
  ApiGps,
  ApiSyncableFile,
  ApiSyncable,
  ApiEchantillonPrelevement,
  ApiEchantillonMobilier,
  ApiEchantillon,
  ApiDocumentMinute,
  ApiDocumentPhoto,
  ApiContenant
} from "../../../shared";
import {LOG} from "ngx-wcore";


export function isContenant(item: ApiSyncable): item is ApiContenant {
  return item?.table === ApiDbTable.contenant;
}

export const contenant = (item: ApiSyncable): ApiContenant | null => {
  if (isContenant(item)) {
    return item as ApiContenant;
  } else {
    LOG.error.log(`item is not a contenant: ${item.table}`);
    return null;
  }
};

export function isDocument(item: ApiSyncable): item is ApiDocument {
  return [ApiDbTable.document_minute, ApiDbTable.document_photo, ApiDbTable.document].includes(item?.table);
}

export const document = (item: ApiSyncable): ApiDocument | null => {
  if (isDocument(item)) {
    return item as ApiDocument;
  } else {
    LOG.error.log(`item is not a document: ${item.table}`);
    return null;
  }
};

export function isDocumentPhoto(item: ApiSyncable): item is ApiDocumentPhoto {
  return item?.table === ApiDbTable.document_photo;
}

export const documentPhoto = (item: ApiSyncable): ApiDocumentPhoto | null => {
  if (isDocumentPhoto(item)) {
    return item as ApiDocumentPhoto;
  } else {
    LOG.error.log(`item is not a document_photo: ${item.table}`);
    return null;
  }
};

export function isDocumentMinute(item: ApiSyncable): item is ApiDocumentMinute {
  return item?.table === ApiDbTable.document_minute;
}

export const documentMinute = (item: ApiSyncable): ApiDocumentMinute | null => {
  if (isDocumentMinute(item)) {
    return item as ApiDocumentMinute;
  } else {
    LOG.error.log(`item is not a document_minute: ${item.table}`);
    return null;
  }
};

export function isEchantillon(item: ApiSyncable): item is ApiEchantillon {
  return item?.table === ApiDbTable.echantillon;
}

export const echantillon = (item: ApiSyncable): ApiEchantillon | null => {
  if (isEchantillon(item)) {
    return item as ApiEchantillon;
  } else {
    LOG.error.log(`item is not an echantillon: ${item.table}`);
    return null;
  }
};

export function isEchantillonMobilier(item: ApiSyncable): item is ApiEchantillonMobilier {
  return item?.table === ApiDbTable.echantillon_mobilier;
}

export const echantillonMobilier = (item: ApiSyncable): ApiEchantillonMobilier | null => {
  if (isEchantillonMobilier(item)) {
    return item as ApiEchantillonMobilier;
  } else {
    LOG.error.log(`item is not an echantillon_mobilier: ${item.table}`);
    return null;
  }
};

export function isEchantillonPrelevement(item: ApiSyncable): item is ApiEchantillonPrelevement {
  return item?.table === ApiDbTable.echantillon_prelevement;
}

export const echantillonPrelevement = (item: ApiSyncable): ApiEchantillonPrelevement | null => {
  if (isEchantillonPrelevement(item)) {
    return item as ApiEchantillonPrelevement;
  } else {
    LOG.error.log(`item is not an echantillon_prelevement: ${item.table}`);
    return null;
  }
};

export function isEnsemble(item: ApiSyncable): item is ApiEnsemble {
  return item?.table === ApiDbTable.ensemble;
}

export const ensemble = (item: ApiSyncable): ApiEnsemble | null => {
  if (isEnsemble(item)) {
    return item as ApiEnsemble;
  } else {
    LOG.error.log(`item is not an ensemble: ${item.table}`);
    return null;
  }
};

export function isFait(item: ApiSyncable): item is ApiFait {
  return item?.table === ApiDbTable.fait;
}

export const fait = (item: ApiSyncable): ApiFait | null => {
  if (isFait(item)) {
    return item as ApiFait;
  } else {
    LOG.error.log(`item is not a fait: ${item.table}`);
    return null;
  }
};

export function isGps(item: ApiSyncable): item is ApiGps {
  return item?.table === ApiDbTable.gps;
}

export const gps = (item: ApiSyncable): ApiGps | null => {
  if (isGps(item)) {
    return item as ApiGps;
  } else {
    LOG.error.log(`item is not a gps: ${item.table}`);
    return null;
  }
};

export function isFile(item: ApiSyncable): item is ApiSyncableFile {
  return item?.table === ApiDbTable.file;
}

export const file = (item: ApiSyncable): ApiSyncableFile | null => {
  if (isFile(item)) {
    return item as ApiSyncableFile;
  } else {
    LOG.error.log(`item is not a file: ${item.table}`);
    return null;
  }
};

// Repeat this structure for all other enum values...
