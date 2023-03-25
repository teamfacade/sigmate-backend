import { randomInt } from 'crypto';
import { DateTime, Settings } from 'luxon';

export type DropletId = string;

Settings.defaultZone = 'utc';

export default class Droplet {
  static machine = randomInt(1000, 10000).toString();

  static SIGMATE_EPOCH = new Date(2017, 1, 1, 0, 0, 0).getTime();

  static timestamp(time: DateTime) {
    const ts = (time.toMillis() - this.SIGMATE_EPOCH).toString();
    return '1' + '0'.repeat(13 - ts.length) + ts;
  }

  private static __counter = 1;
  static counter() {
    if (this.__counter >= 9999) this.__counter = 1;
    return this.__counter++;
  }

  static getCheckSum(droplet: string) {
    return (
      Array.from(droplet.slice(0, 22)).reduce(
        (sum, d) => sum + parseInt(d),
        0
      ) % 10
    );
  }

  static generate(time?: DateTime) {
    const ts = this.timestamp(time || DateTime.now());
    let counter = this.counter().toString();
    counter = '0'.repeat(4 - counter.length) + counter;
    const droplet = `${ts}${this.machine}${counter}`;
    return `${droplet}${this.getCheckSum(droplet)}`;
  }

  static getTime(droplet: string) {
    return this.getDateTime(droplet).toMillis();
  }

  static getISO(droplet: string) {
    return this.getDateTime(droplet).toISO();
  }

  static getDateTime(droplet: string) {
    const timestamp = droplet.slice(1, 14);
    return DateTime.fromMillis(
      Number.parseInt(timestamp) + Droplet.SIGMATE_EPOCH
    );
  }

  static isValid(droplet: string, options: { throws?: boolean } = {}) {
    try {
      if (droplet.length !== 23) throw new Error('Invalid length');
      if (droplet[0] !== '1') throw new Error('Invalid prefix');
      const ts = droplet.slice(1, 14);
      let millis: number;
      try {
        millis = Number.parseInt(ts) + this.SIGMATE_EPOCH;
      } catch (error) {
        throw new Error('Invalid timestamp');
      }
      if (!DateTime.fromMillis(millis).isValid) {
        throw new Error('Invalid date');
      }
      if (millis > Date.now()) throw new Error('Invalid time');
      if (this.getCheckSum(droplet).toString() !== droplet.slice(26)) {
        throw new Error('Invalid checksum');
      }
      return true;
    } catch (error) {
      if (options.throws) throw error;
      return false;
    }
  }

  private droplet: string;
  constructor() {
    this.droplet = Droplet.generate();
  }

  getTime() {
    return Droplet.getTime(this.droplet);
  }

  toString() {
    return this.droplet;
  }
}
