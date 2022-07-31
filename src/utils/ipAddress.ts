/**
 * Convert IPv4 address to integer
 * @param {string} ip IPv4 address
 * @returns {Integer} IPv4 in Integer form
 */
export const ipToInt = (ip: string): number => {
  if (!ip) throw new Error('ERR_IPV4_UNDEFINED');
  const ipPattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;
  if (!ipPattern.test(ip)) throw new Error('ERR_NOT_IPV4');

  return ip
    .split('.')
    .map((bit, idx) => {
      return parseInt(bit) * Math.pow(256, 3 - idx);
    })
    .reduce((p, c) => p + c);
};

/**
 * Convert integer IPv4 address value to string
 * @param ip IPv4 address in unsigned integer form
 * @returns IPv4 quad-dotted decimal representation
 */
export const intToIp = (ip: number): string => {
  if (!ip) throw new Error('ERR_IPV4_UNDEFINED');
  return `${(ip >> 24) & 0xff}.${(ip >> 16) & 0xff}.${(ip >> 8) & 0xff}.${
    ip & 0xff
  }`;
};
