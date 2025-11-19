const default_timeRef = 'created';
const default_additional_fields = ',user_uuid,projet_uuid';

const generate_optional_key = (key: string) => key ? (',' + key) : '';
const obj_keygen = (
  uuid: string,
  optional: {
    secteur_uuid?: boolean
  } = {},
) => {
  return (
    '&[' + uuid + '+' + default_timeRef + '],'
    + uuid
    + ',&' + default_timeRef
    + default_additional_fields
    + (optional.secteur_uuid ? generate_optional_key('secteur_uuid') : '')
  );
}
const type_keygen = (uuid: string) => {
  return (
    '&[' + uuid + '+' + default_timeRef + '],'
    + uuid
    + ',&' + default_timeRef
  );
}
const link_keygen = (
  obj1_uuid: string, obj2_uuid: string
) => {
  return (
    '&[' + obj1_uuid + '+' + obj2_uuid + '+' + default_timeRef + ']'
    + ',[' + obj2_uuid + '+' + obj1_uuid + ']'
    + ',[' + obj2_uuid + '+' + default_timeRef + ']'
    + ',[' + obj1_uuid + '+' + default_timeRef + ']'
    + ',' + obj1_uuid + ',' + obj2_uuid + ',&' + default_timeRef
    + default_additional_fields
  )
};

export const castor_schema: {
  readonly [tableName: string]: string | null;
} = {

  /**
   * MAIN
   */
  projet: '&[projet_uuid+created],&created,owner_uuid' + default_additional_fields,

  /**
   * TYPES
   */
  type: '&[type_uuid+created], &[projet_uuid+type_uuid],created,type_uuid,projet_uuid,type_category_uuid',

  /**
   * FILES
   */
  file: '&file_uuid, projet_uuid',

  /**
   * OBJECTS
   */
  secteur: obj_keygen('secteur_uuid'),
  us: obj_keygen('us_uuid', {secteur_uuid: true}),
  fait: obj_keygen('fait_uuid', {secteur_uuid: true}),
  contenant: obj_keygen('contenant_uuid'),
  document: obj_keygen('document_uuid'),
  ensemble: obj_keygen('ensemble_uuid'),
  gps: obj_keygen('gps_uuid'),
  echantillon: obj_keygen('echantillon_uuid'),
  mouvement: obj_keygen('mouvement_uuid'),
  phase: obj_keygen('phase_uuid'),
  section: obj_keygen('section_uuid'),
  stratigraphie: obj_keygen('stratigraphie_uuid'),
  topo: obj_keygen('topo_uuid'),


  /**
   * RELATIONSHIPS
   */
  document_echantillon: link_keygen('document_uuid', 'echantillon_uuid'),
  document_fait: link_keygen('document_uuid', 'fait_uuid'),
  document_section: link_keygen('document_uuid', 'section_uuid'),
  document_us: link_keygen('document_uuid', 'us_uuid'),
  ensemble_document: link_keygen('document_uuid', 'ensemble_uuid'),
  topo_document: link_keygen('document_uuid', 'topo_uuid'),
  topo_echantillon: link_keygen('topo_uuid', 'echantillon_uuid'),
  topo_ensemble: link_keygen('topo_uuid', 'ensemble_uuid'),
  topo_fait: link_keygen('topo_uuid', 'fait_uuid'),
  topo_section: link_keygen('topo_uuid', 'section_uuid'),
  topo_us: link_keygen('topo_uuid', 'us_uuid'),
  section_ensemble: link_keygen('section_uuid', 'ensemble_uuid'),
  section_fait: link_keygen('section_uuid', 'fait_uuid'),
  section_us: link_keygen('section_uuid', 'us_uuid'),
  ensemble_fait: link_keygen('ensemble_uuid', 'fait_uuid'),
  ensemble_us: link_keygen('ensemble_uuid', 'us_uuid'),
  secteur_gps: link_keygen('secteur_uuid', 'gps_id'),
  contenant_echantillon: link_keygen('contenant_uuid', 'echantillon_uuid'),

};

export const session_schema: {
  readonly [tableName: string]: string | null;
} = {
  user: '&user_uuid',
  projet_index: '&projet_uuid'
}
