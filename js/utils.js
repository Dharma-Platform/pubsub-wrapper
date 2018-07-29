const uintToString = (uintArray) => {
  const encodedString = String.fromCharCode.apply(null, uintArray);
  const decodedString = decodeURIComponent(escape(encodedString));
  return decodedString;
};

const endodedStringifiedJSONParse = data =>
  JSON.parse(uintToString(data).replace("'", '"').replace(/['"]/g, '"')); // eslint-disable-line 

module.exports = {
  uintToString: uintToString,
  endodedStringifiedJSONParse: endodedStringifiedJSONParse,
};
