export type MethodDecorator = (
  target: any,
  key: string,
  desc?: PropertyDescriptor
) => void;
