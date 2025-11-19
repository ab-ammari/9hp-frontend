import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'UserDataclass'
}

export class UserDataclass {

  constructor() {
    LOG.debug.log({...CONTEXT});
  }

}

export interface Auth0User {
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: string;
  updated_at?: string;
  sub: string;
}
