const BaseStates = Object.freeze({
  INITIALIZED: 0,
  // STARTING: 1,
  STARTED: 2,
  // FINISHED: 3,
  // CLOSING: 4,
  // CLOSED: 5,
  FAILED: 6,
});

export const ClosableStates = Object.freeze({
  ...BaseStates,
  STARTING: 1,
  CLOSING: 4,
  CLOSED: 5,
});

export const FinishableStates = Object.freeze({
  ...BaseStates,
  FINISHED: 3,
});

export const AllStates = Object.freeze({
  ...BaseStates,
  ...ClosableStates,
  ...FinishableStates,
});

export type AllStateName = keyof typeof AllStates;

export const ServerStatus = ClosableStates;
export const ServiceStatus = ClosableStates;
export const RequestStatus = FinishableStates;
export const ActionStatus = FinishableStates;

export function printStatus(
  status: typeof AllStates[keyof typeof AllStates] | undefined,
  options: { lower?: boolean; dots?: boolean } = {}
) {
  if (status === undefined) return undefined;
  let fStatus = ''; // return value
  switch (status) {
    case AllStates.INITIALIZED:
      fStatus = 'INITIALIZED';
      break;
    case AllStates.STARTING:
      fStatus = 'STARTING';
      break;
    case AllStates.STARTED:
      fStatus = 'STARTED';
      break;
    case AllStates.FINISHED:
      fStatus = 'FINISHED';
      break;
    case AllStates.CLOSING:
      fStatus = 'CLOSING';
      break;
    case AllStates.CLOSED:
      fStatus = 'CLOSED';
      break;
    case AllStates.FAILED:
      fStatus = 'FAILED';
      break;
  }

  if (options.lower) {
    fStatus = fStatus.toLowerCase();
  }

  if (options.dots) {
    if (status === AllStates.STARTING || status === AllStates.CLOSING) {
      fStatus += '...';
    }
  }

  return fStatus;
}
