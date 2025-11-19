export class Time {
    static isSummerTime(date: Date): boolean {
        // DST starts on the last Sunday of March and ends on the last Sunday of October.
        // get DST SUMMER switch
        const dstSUMMER: Date = Time.lastSunday(date.getFullYear(), 3);
        console.log("DSTSUMMER", dstSUMMER);
        //get DST WINTER switch
        const dstWINTER: Date = Time.lastSunday(date.getFullYear(), 10);
        return date.getTime() > dstSUMMER.getTime() && date.getTime() < dstWINTER.getTime();
    }

    static lastSunday(year: any, month: any): Date {
        const date = new Date(year, month, 1, 1, 59);
        const weekday = date.getDay();
        const dayDiff = weekday === 0 ? 7 : weekday;
        date.setDate(date.getDate() - dayDiff);
        return date;
    }

    static transformToLocalTime(utc: Date, utc_offset_minutes: number): Date {
        const now = new Date();
        if (Time.isSummerTime(now) === Time.isSummerTime(utc)) {
            console.log("TIME SAME", now, utc);
            return Time.migrateDateToLocal(utc, utc_offset_minutes);
        } else if (Time.isSummerTime(utc)) {
            console.log("TIME utc is DST", now, utc);
            return Time.migrateDateToLocal(utc, utc_offset_minutes - 60);
        } else {
            console.log("TIME now is DST", now, utc);
            return Time.migrateDateToLocal(utc, utc_offset_minutes + 60);
        }
    }

    static transformToTimezoneTime(utc: Date, utc_offset_minutes: number): number {
        const now = new Date();
        if (Time.isSummerTime(now) === Time.isSummerTime(utc)) {
            console.log("TIME SAME", now, utc);
            return Time.migrateDateToTimezone(utc, utc_offset_minutes);
        } else if (Time.isSummerTime(utc)) {
            console.log("TIME now is DST", now, utc);
            return Time.migrateDateToTimezone(utc, utc_offset_minutes - 60);
        } else {
            console.log("TIME utc is DST", now, utc);
            return Time.migrateDateToTimezone(utc, utc_offset_minutes + 60);
        }
    }

    static migrateDateToTimezone(date: Date, offset: number): number {
        const d: Date = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes())
        );
        console.log("TIME migrateDateToTimezone1", d.toUTCString());
        d.setMinutes(d.getMinutes() - offset);
        console.log("TIME migrateDateToTimezone2", d.toUTCString());
        return d.getTime();
    }

    static migrateDateToLocal(date: Date, offset: number): Date {
        console.log("TIME migrateDateToLocal1", date, offset);
        date.setMinutes(date.getMinutes() + offset);
        console.log("TIME migrateDateToLocal2", date, offset);
        return date;
    }
}
