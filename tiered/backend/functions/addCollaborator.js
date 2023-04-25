exports = async function (userId, teamName) {

  var collection = context.services.get("mongodb-atlas").db("Item").collection("User");

  const filter = { _id: userId };
  const update = { $addToSet: { collaborators: teamName } };
  const options = { upsert: false };

  let result = await collection.updateOne(filter, update, options);

  return result;
};