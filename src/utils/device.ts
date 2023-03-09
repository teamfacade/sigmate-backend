import { Request } from 'express';
import UAParser from 'ua-parser-js';
import { Address4, Address6 } from 'ip-address';

export default class ClientDevice {
  private static BROWSER = Object.freeze({
    NAVER: /NAVER\(\S*;\s*\S*;\s*\S*;\s*(?<ver>(?<major>\d+)\.\d+\.\d+);.*\)/,
    KAKAO: /KAKAOTALK\s*(?<ver>(?<major>\d+)\.\d+\.\d+)/,
  });

  ip: string;
  device: UAParser.IResult;
  constructor(args: { ip?: string; ua?: string; req?: Request }) {
    const ip = args.ip || args.req?.clientIp || args.req?.ip;
    const ua = args.ua || args.req?.header('user-agent');
    this.ip = this.parseIp(ip);
    this.device = this.parseDevice(ua);
  }

  get os() {
    return this.device.os.name;
  }

  get fullOs() {
    return `${this.device.os.name} ${this.device.os.version}`;
  }

  get browser() {
    return this.device.browser.name;
  }

  get fullBrowser() {
    return `${this.device.browser.name} ${this.device.browser.version}`;
  }

  get model() {
    return this.device.device.model || this.device.device.vendor;
  }

  get type() {
    return this.device.device.type;
  }

  get ua() {
    return this.device.ua;
  }

  private parseIp(ip: string | undefined) {
    if (!ip) return '';
    let parsedIp = '';
    let type: 'ipv4' | 'ipv6' | undefined;
    try {
      const a4 = new Address4(ip);
      parsedIp = a4.addressMinusSuffix || a4.address;
      type = 'ipv4';
    } catch (error) {
      type = undefined;
    }
    if (!type) {
      try {
        const a6 = new Address6(ip);
        parsedIp = a6.addressMinusSuffix || a6.address;
        type = 'ipv6';
      } catch (error) {
        type = undefined;
      }
    }
    return parsedIp;
  }

  private parseDevice(ua: string | undefined) {
    const device = UAParser(ua);
    if (!this.isDeviceDetected(device)) {
      this.detectKBrowsers(device);
    }
    return device;
  }

  private isDeviceDetected(result: UAParser.IResult) {
    if (!result) return false;
    const { ua, browser, device, engine, os, cpu } = result;
    if (ua) {
      if (
        browser.name ||
        device.model ||
        device.type ||
        device.vendor ||
        engine.name ||
        os.name ||
        cpu.architecture
      )
        return true;
    }
    return false;
  }

  private detectKBrowsers(result: UAParser.IResult) {
    if (!result) return;
    const { ua } = result;

    let found = false;

    if (!found) {
      const isNaver = ua.match(ClientDevice.BROWSER.NAVER);
      if (isNaver && isNaver.groups) {
        found = true;
        const { ver, major } = isNaver.groups;
        result.browser.name = 'Naver App';
        result.browser.version = ver;
        result.browser.major = major;
      }
    }

    if (!found) {
      const isKakaoTalk = ua.match(ClientDevice.BROWSER.KAKAO);
      if (isKakaoTalk && isKakaoTalk.groups) {
        const { ver, major } = isKakaoTalk.groups;
        result.browser.name = 'KakaoTalk In-App';
        result.browser.version = ver;
        result.browser.major = major;
      }
    }

    return result;
  }
}
