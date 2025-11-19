import {ApiDbTable} from "../DbInterfaces";

export enum UsTypeEnum {
  TECHNIQUE = ApiDbTable.us_technique,
  NEGATIVE = ApiDbTable.us_negative,
  POSITIVE = ApiDbTable.us_positive,
  CONSTRUITE = ApiDbTable.us_construite,
  BATI = ApiDbTable.us_bati,
  SQUELETTE = ApiDbTable.us_squelette
}
