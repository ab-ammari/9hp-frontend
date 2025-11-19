import {genericTableColumn} from "../../../../../Display/generic-content-table/links/generic-content-table.component";
import {ApiDbTable} from "../../../../../../../../shared";

export const common_headers: Array<genericTableColumn> = [
  {
    origin: 'relation',
    label: 'Modification',
    key: 'created',
    format: 'date'
  },
  {
    origin: 'target',
    label: 'Table',
    key: 'table',
    format: 'string'
  },
/*  {
    origin: 'relation',
    label: 'Notes',
    key: 'note',
    format: 'string'
  }*/
];
/*DOC*/
export function document_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Aperçu',
      key: 'document_file_uuid',
      format: 'image'
    },
    {
      origin,
      label: 'Type',
      key: 'type',
      format: 'string'
    },
    {
      origin,
      label: 'Label',
      key: 'label',
      format: 'string'
    },
    {
      origin,
      label: 'Remarques',
      key: 'document_remarques',
      format: 'string'
    }
  ]
}

export function minute_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Type',
      key: 'type_releve',
      format: 'type'
    },
    {
      origin,
      label: 'Echelle',
      key: 'echelle_releve',
      format: 'type'
    }
  ];
}

export function minute_topo_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    /*{
      origin,
      label: 'Sujet',
      key: '',
      format: 'string'
    }*/
  ];
}
/* ECHANTILLON */
export function echantillon_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Remarque',
      key: 'echantillon_description',
      format: 'string'
    }
  ];
}

export function mobilier_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Type',
      key: 'mobilier_type_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Materiau',
      key: 'type_materiaux_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Identification',
      key: 'mobilier_identification_uuid',
      format: 'type'
    }
  ];
}

export function mobilier_contenant_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Datation',
      key: 'mobilier_datation_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Etat',
      key: 'mobilier_etat_uuid',
      format: 'type'
    }
  ];
}

export function prelevement_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Nature',
      key: 'type_nature_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Quantité',
      key: 'prelevement_quantite',
      format: 'type'
    }
  ];
}

/* CONTENANT  */
export function contenant_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Contenue',
      key: 'contenant_uuid_contient',
      format: 'string'
    },
    {
      origin,
      label: 'Remarque',
      key: 'contenant_remarques',
      format: 'string'
    }
  ];
}

/* FAIT */
export function fait_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Identification',
      key: 'fait_identification_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Remarque',
      key: 'fait_description',
      format: 'string'
    }
  ];
}

/* US */
export function us_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Fait',
      key: 'fait_uuid',
      format: 'otherTag',
      otherTagTable: ApiDbTable.fait
    },
    {
      origin,
      label: 'Identification',
      key: 'us_identification_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Remarques',
      key: 'us_description',
      format: 'string'
    }
  ];
}

/* ENSEMBLE */
export function ensemble_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'identification',
      key: 'ensemble_identification_uuid',
      format: 'type'
    },
    {
      origin,
      label: 'Remarques',
      key: 'ensemble_description',
      format: 'string'
    }
  ];
}

/* TOPO */
export function topo_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Type',
      key: 'topo_type',
      format: 'type'
    },
    {
      origin,
      label: 'Remarques',
      key: 'topo_remarques',
      format: 'string'
    },
    {
      origin,
      label: 'Z',
      key: 'topo_loc_z',
      format: 'number'
    }
  ];
}

export function topo_minute_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Type',
      key: 'topo_type',
      format: 'type'
    },
    {
      origin,
      label: 'Remarques',
      key: 'topo_remarques',
      format: 'string'
    },
    {
      origin,
      label: 'Levée',
      key: 'topo_levee',
      format: 'boolean'
    }
  ];
}

/* SECTION */
export function section_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Type',
      key: 'section_type',
      format: 'type'
    },
    {
      origin,
      label: 'Remarques',
      key: 'section_notes',
      format: 'string'
    }
  ];
}

export function fait_section_headers(origin: 'reference' | 'target' | 'relation'): Array<genericTableColumn> {
  return [
    {
      origin,
      label: 'Profil',
      key: 'profile',
      format: 'type'
    },
    {
      origin,
      label: 'Largeur',
      key: 'largeur',
      format: 'string'
    }, {
      origin,
      label: 'Hauteur',
      key: 'hauteur',
      format: 'string'
    },
    {
      origin,
      label: 'ZSup',
      key: 'z_supp',
      format: 'string'
    },
    {
      origin,
      label: 'ZInf',
      key: 'z_inf',
      format: 'string'
    },
  ];
}
