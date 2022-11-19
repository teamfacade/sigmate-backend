import RequestError, { HttpStatusCode } from './RequestError';

export default class DeviceError extends RequestError {
  static MESSAGES = {
    // Client IP address parse fail
    'DEVICE/INIT/IP/UNDEFINED': 'ERR_DEVICE_INIT_IP_UNDEFINED',
    'DEVICE/INIT/IP/INVALID': 'ERR_DEVICE_INIT_IP_INVALID',
    // Device findOrCreate fail
    'DEVICE/INIT': 'ERR_DEVICE_INIT',
  };
  constructor(
    message: keyof typeof DeviceError['MESSAGES'],
    origin: unknown = undefined
  ) {
    let status: HttpStatusCode = 500;
    let unexpected = false;
    switch (message) {
      default:
        status = 500;
        unexpected = true;
        break;
    }
    super(status, {
      name: 'DeviceError',
      message: DeviceError.MESSAGES[message],
      origin,
      unexpected,
    });
  }
}
