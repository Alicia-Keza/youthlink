const { toList } = require('./lists');

// Checks that text fields are not too long.
// checks is a list of [value, maximum length, name shown to the user].
// Returns an error message, or null when everything is fine.
function checkLengths(checks) {
  for (const [value, max, label] of checks) {
    if (String(value ?? '').trim().length > max) {
      return `${label} must be ${max} characters or less`;
    }
  }
  return null;
}

// Checks a comma separated list such as interests: at most 20 items of 50 characters each
function checkList(value, label) {
  const items = toList(value);
  if (items.length > 20) {
    return `You can add at most 20 ${label.toLowerCase()}`;
  }
  if (items.some((item) => item.length > 50)) {
    return `Each of your ${label.toLowerCase()} must be 50 characters or less`;
  }
  return null;
}

module.exports = { checkLengths, checkList };
