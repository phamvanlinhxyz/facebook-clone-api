Object.clone = function (obj) {
  if (obj) {
    obj = JSON.parse(JSON.stringify(obj));
  }
  return obj;
};
