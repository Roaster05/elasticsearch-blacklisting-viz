export default function stringToJson(str) {
  const arr = [];
  const lines = str.split("\n").slice(2);
  lines.forEach((line) => {
    const words = line.match(/\S+/g);
    if (words) {
      const json = {
        Query: words[0],
        Identifier: words[1],
        ExecutionTime: words[2],
        Timestamp: words[3],
      };
      arr.push(json);
    }
  });
  return arr;
}
