import {ApiErrorTraduction} from "./ApiErrorTraduction";
import {LanguageCode} from "./LanguageCode";

export class ApiErrorCode {

  private code: number;
  private title: string;
  private messages: Array<ApiErrorTraduction>;

  constructor(code: number, title: string, messages: Array<ApiErrorTraduction> = []) {
    this.code = code;
    this.title = title;
    this.messages = messages;
  }

  public toString(): string {
    return 'ERR-' + this.code.toString();
  }

  public getMessage(langue: LanguageCode = LanguageCode.FR): string {
    /**
     * FIRST return right language
     */
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].language === langue) {
        return this.messages[i].message;
      }
    }

    /**
     * RETURN IN ENGLISH
     */
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].language === LanguageCode.EN) {
        return this.messages[i].message;
      }
    }

    /**
     * ELSE
     */
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].language === LanguageCode.DEV) {
        return this.messages[i].message;
      }
    }
  }

}




