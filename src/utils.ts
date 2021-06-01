export const randomId = (len = 8) => {
  const randomStr = Math.random().toString(36);
  return randomStr.substr(-len);
};

export const deepClone = (obj: { [propName: string]: any }) => {
  return JSON.parse(JSON.stringify(obj));
};

export const getType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const capitalString = (str: string) => {
  if (str.length < 2) {
    return str.toUpperCase();
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
};

export const removeAppid = (str: string, appid: string) => {
  const suffix = `-${appid}`;
  if (!str || str.indexOf(suffix) === -1) {
    return str;
  }
  return str.slice(0, -suffix.length);
};
