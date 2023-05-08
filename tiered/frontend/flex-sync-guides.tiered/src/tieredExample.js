import * as BSON from "BSON";
import { logInOrRegister } from "./logInOrRegister.js";
import { app } from "./index.js";
import { getRealm } from "./getRealm.js";

let adminDoc1Id;
let adminDoc2Id;
let memberDoc1Id;
let memberDoc2Id;
const greenTeamAdminAccount = {
  email: "teamAdmin",
  password: "password",
};
const greenTeamMemberAccount = {
  email: "greenTeamMember",
  password: "password",
};
const blueTeamMemberAccount = {
  email: "blueTeamMember",
  password: "password",
};

const ItemSchema = {
  name: "Item",
  properties: {
    _id: 'objectId',
    isHidden: 'bool?',
    name: 'string',
    owner_id: 'string',
    team: 'string',
    priority: 'int?'
  },
  primaryKey: "_id",
};
const schema = [ItemSchema];

export const tieredExample = async () => {
  console.log(`

  tieredExample
  -------------

  This function demonstrates the "tiered privileges" permissions model. 

  The demo logs in as two different users, "admin" and "member". The admin calls
  the backend function "addTeam" with the parameter to set themselves as an
  admin. 

  In a real app, you wouldn't let clients just set themselves as admin! This is
  just for demo purposes.

  The admin then adds a couple documents and logs out. The member then logs in
  and also joins the team with the same backend function. The member creates a
  couple documents and logs out.

  The admin then logs in and proves they can edit not only their own documents
  but the member's documents as well. The member then logs in and attempts to
  edit the admin's documents, but fails.

  If permissions are set up correctly, you can expect the following behavior:

  - The admin may write any doc with the same team value.
  - The member may read any doc with the same team value, but can only edit
    their own docs.

`);

  await setUpAdmin();
  await setUpGreenMember();
  await setUpBlueMember();

};

const setUpAdmin = async () => {
  console.log("Logging in as admin");
  const admin = await logInOrRegister(greenTeamAdminAccount);

  console.log("Adding admin as Admin on team 'greenTeam'");
  //const adminFuncArgs = [admin.id, ["greenTeam","blueTeam"], true /* make admin */];
  const adminFuncResult = await admin.callFunction("joinTeam", admin.id, ["greenTeam","blueTeam"], true);
  console.log(adminFuncResult);

  // Refresh user data to validate that adminhood successfully granted
  const customData = await admin.refreshCustomData();
  console.log("Custom data:", JSON.stringify(customData));

  const realm = await getRealm({ user: admin, schema });

  const adminItems = realm.objects("Item");
  await realm.subscriptions.update((mutableSubs) => {
    mutableSubs.add(adminItems);
  });

  console.log("Create items owned by admin");
  realm.write(() => {
    adminDoc1Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: adminDoc1Id,
      owner_id: admin.id,
      name: "Admin created this",
      team: "greenTeam",
      priority: 1,
      isHidden: false
    });
    adminDoc2Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: adminDoc2Id,
      owner_id: admin.id,
      name: "Admin created this too, but this is hidden",
      team: "blueTeam",
      priority: 2,
      isHidden: true
    });
  });

  await realm.syncSession.uploadAllLocalChanges();

  console.log("Logging out admin");
  realm.close();
  await app.currentUser.logOut();
};

const setUpGreenMember = async () => {
  console.log("Logging in as a green member of team");
  const member = await logInOrRegister(greenTeamMemberAccount);

  console.log("Adding member as member of team 'greenTeam'");
  //const funcArgs = [member.id, "greenTeam", false /* not admin */];
  const funcResult = await member.callFunction("joinTeam", member.id, ["greenTeam"], false);
  console.log(funcResult);

  console.log("Opening synced realm for member");
  const realm = await getRealm({ user: member, schema });

  await realm.subscriptions.update((mutableSubs) => {
    mutableSubs.add(realm.objects("Item"));
  });

  console.log("Creating item owned by green team member");
  realm.write(() => {
    memberDoc1Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: memberDoc1Id,
      owner_id: member.id,
      name: "GreenTeam Member created this",
      team: "greenTeam",
      priority: 4
    });
    memberDoc2Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: memberDoc2Id,
      owner_id: member.id,
      name: "GreenTeam Member created this, too",
      team: "greenTeam",
      priority: 2
    });
  });

  await realm.syncSession.uploadAllLocalChanges();

  realm.close();
  await member.logOut();
};

const setUpBlueMember = async () => {
  console.log("Logging in as a blue member of team");
  const member = await logInOrRegister(blueTeamMemberAccount);

  console.log("Adding member as member of team 'blueTeam'");
  //const funcArgs = [member.id, "greenTeam", false /* not admin */];
  const funcResult = await member.callFunction("joinTeam", member.id, ["blueTeam"], false);
  console.log(funcResult);

  console.log("Opening synced realm for member");
  const realm = await getRealm({ user: member, schema });

  await realm.subscriptions.update((mutableSubs) => {
    mutableSubs.add(realm.objects("Item"));
  });

  console.log("Creating item owned by blue team member");
  realm.write(() => {
    memberDoc1Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: memberDoc1Id,
      owner_id: member.id,
      name: "BlueTeam Member created this",
      team: "blueTeam",
      priority: 1
    });
    memberDoc2Id = new BSON.ObjectID();
    realm.create("Item", {
      _id: memberDoc2Id,
      owner_id: member.id,
      name: "BlueTeam Member created this, too",
      team: "blueTeam",
      priority: 2
    });
  });

  await realm.syncSession.uploadAllLocalChanges();

  realm.close();
  await member.logOut();
};

const canAdminEdit = async () => {
  console.log("Logging in again as admin");
  const admin = await logInOrRegister(greenTeamAdminAccount);

  const realm = await getRealm({ user: admin, schema });

  let adminItems = realm.objects("Item");
  await realm.subscriptions.update((mutableSubs) => {
    mutableSubs.add(adminItems);
  });

  await realm.subscriptions.waitForSynchronization();
  adminItems = realm.objects("Item");
  console.log("GreenTeam's Admin can read the following documents:");

  adminItems.forEach((element) => {
    console.log(JSON.stringify(element));
  });
  const adminDoc1 = realm.objectForPrimaryKey("Item", adminDoc1Id);

  console.log("GreenTeam Admin is editing GreenTeam Admin doc", adminDoc1._id);
  try {
    realm.write(() => {
      adminDoc1.name += ", and GreenTeam Admin edited it!";
    });
  } catch (e) {
    console.error(e);
  }
  console.log(memberDoc1Id);
  const memberDoc1 = realm.objectForPrimaryKey("Item", memberDoc1Id);
  console.log(memberDoc1);
  console.log(
    "GreenTeam Admin is editing GreenTeam Member doc",
    memberDoc1._id
  );
  try {
    realm.write(() => {
      memberDoc1.name += ", and GreenTeam Admin edited it!";
    });
  } catch {
    console.error(e);
  }

  try {
    await realm.syncSession.uploadAllLocalChanges();
  } catch (e) {
    console.error("Failed to upload all changes: ", e.message);
  }
  realm.close();
  await admin.logOut();
};

const canMemberEdit = async () => {
  console.log("Logging in again as GreenTeam Member");
  const member = await logInOrRegister(greenTeamMemberAccount);

  const realm = await getRealm({ user: member, schema });

  const memberItems = realm.objects("Item");
  await realm.subscriptions.update((mutableSubs) => {
    mutableSubs.add(memberItems);
  });
  console.log("GreenTeam's Member can read the following documents:");

  memberItems.forEach((element) => {
    console.log(JSON.stringify(element));
  });

  const memberDoc2 = realm.objectForPrimaryKey("Item", memberDoc2Id);
  console.log(
    "GreenTeam Member is editing GreenTeam Member doc",
    memberDoc2._id
  );
  try {
    realm.write(() => {
      memberDoc2.name += ", and GreenTeam Member edited it!";
    });
  } catch (e) {
    console.error(e);
  }

  const adminDoc2 = realm.objectForPrimaryKey("Item", adminDoc2Id);
  console.log("Member is editing GreenTeam Admin doc", adminDoc2);
  try {
    realm.write(() => {
      adminDoc2.name += ", and GreenTeam Member edited it!";
    });
  } catch (e) {
    console.error(e);
  }

  try {
    await realm.syncSession.uploadAllLocalChanges();
  } catch (e) {
    console.error("Failed to upload all changes: ", e.message);
  }
  console.log(
    "The console should show a message when failing to edit the Admin document. " +
      "There should be 1 edited doc."
  );

  realm.close();
  await member.logOut();
};
