// Lists such as interests are stored in the database as comma separated text.
// toList accepts either an array or text and returns a clean array.
function toList(value) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  const clean = items.map((item) => String(item).trim()).filter(Boolean);
  return [...new Set(clean)];
}

function toText(value) {
  return toList(value).join(',');
}

module.exports = { toList, toText };
