const DATA: Record<string, any> = {};

// export const get = (key: string): string => {
//   return DATA[key];
// };

// export const set = (key: string, value: string): void => {
//   DATA[key] = value;
// };

export const setJson = (key: string, value: any): void => {
  DATA[key] = value;
};

export const getJson = (key: string): any => {
  return DATA[key];
};

export const printState = () => {
  console.log('Store state: ', DATA);
};
