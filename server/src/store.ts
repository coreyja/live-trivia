const DATA: Record<string, string> = {};

export const get = (key: string): string => {
  return DATA[key];
};

export const set = (key: string, value: string): void => {
  DATA[key] = value;
};

export const setJson = (key: string, value: any): void => {
  DATA[key] = JSON.stringify(value);
};

export const getJson = (key: string): any => {
  const raw = DATA[key];
  return raw && JSON.parse(raw);
};
