// Complementary skill matching.
// Two users are a good match when one has skills in an area the other is
// looking for. Shared interests add a small bonus.

function skillAreas(profile) {
  return [...new Set(profile.skills.map((skill) => skill.category))];
}

function scoreMatch(me, other) {
  // Skill areas they have that I am looking for
  const theyOffer = skillAreas(other).filter((area) => me.lookingFor.includes(area));
  // Skill areas I have that they are looking for
  const iOffer = skillAreas(me).filter((area) => other.lookingFor.includes(area));

  const theirInterests = other.interests.map((interest) => interest.toLowerCase());
  const sharedInterests = me.interests.filter((interest) => theirInterests.includes(interest.toLowerCase()));

  const score = theyOffer.length * 3 + iOffer.length * 2 + sharedInterests.length;
  return { score, theyOffer, iOffer, sharedInterests };
}

// Returns the users whose skills complement mine, best match first.
function findMatches(me, others) {
  return others
    .map((other) => ({ user: other, ...scoreMatch(me, other) }))
    .filter((match) => match.theyOffer.length > 0 || match.iOffer.length > 0)
    .sort((a, b) => b.score - a.score);
}

module.exports = { scoreMatch, findMatches };
