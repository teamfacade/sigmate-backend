export function isDeviceDetected(result: UAParser.IResult) {
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

const REGEX_NAVER =
  /NAVER\(\S*;\s*\S*;\s*\S*;\s*(?<ver>(?<major>\d+)\.\d+\.\d+);.*\)/;
const REGEX_KAKAO = /KAKAOTALK\s*(?<ver>(?<major>\d+)\.\d+\.\d+)/;

/**
 * Parse user agent for Korean in-app browsers
 *
 * Possible browser names:
 * `Naver`, `KakaoTalk`
 */
export function detectKBrowsers(result: UAParser.IResult) {
  const { ua } = result;
  const newResult = { ...result };

  let found = false;

  if (!found) {
    const isNaver = ua.match(REGEX_NAVER);
    if (isNaver && isNaver.groups) {
      found = true;
      const { ver, major } = isNaver.groups;
      newResult.browser.name = 'Naver';
      newResult.browser.version = ver;
      newResult.browser.major = major;
    }
  }

  if (!found) {
    const isKakaoTalk = ua.match(REGEX_KAKAO);
    if (isKakaoTalk && isKakaoTalk.groups) {
      const { ver, major } = isKakaoTalk.groups;
      newResult.browser.name = 'KakaoTalk';
      newResult.browser.version = ver;
      newResult.browser.major = major;
    }
  }

  return newResult;
}
