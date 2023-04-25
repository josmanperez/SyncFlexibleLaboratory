exports = async function (userId, team, isAdmin = false) {

  var collection = context.services.get("mongodb-atlas").db("Item").collection("User");

  const filter = { _id: userId };
  const update = { $set: { teams: team, isTeamAdmin: isAdmin } };
  const options = { upsert: false };

  let result = await collection.updateOne(filter, update, options);

  return result;
};