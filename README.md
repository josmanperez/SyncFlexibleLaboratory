# Prerequisits

- [Atlas cluster](https://www.mongodb.com/docs/atlas/tutorial/create-new-cluster/)
- [NodeJS and NPM installed](https://nodejs.org/en)
- [App Services CLI](https://www.mongodb.com/docs/atlas/app-services/cli/)

# How to run

1. Download the [repository](https://github.com/josmanperez/SyncFlexibleLaboratory) locally to your computer.
2. Log in to [App Services CLI](https://www.mongodb.com/docs/atlas/app-services/cli/) using your private/public key from the project you want to deploy this app 
3. Run the following command from the base folder
`realm-cli apps create --name=tiered --local tiered/backend`
4. There is currently a bug that prevents the full app to be deployed, so to workaround it, we will need to reset the branch by running
`git reset --hard head`
5. After, running
`realm-cli push --local tiered/backend`
6. Once the app has been created, annotate the output
```json
{
  "client_app_id": "tiered1-pxnnr",
  "filepath": "/Users/josman.perez/Desktop/SyncFlexibleLaboratory/tiered/backend-1",
  "url": "https://realm.mongodb.com/groups/60cc8dbec9eea573f640b38d/apps/6447e78746afe412736f7dec/dashboard"
}
```
7. We need to add `client_app_id` and `url` (*without the `/dashboard`*) in the file `tiered/frontend/flex-sync-guides.tiered/src/realm.json`
8. Access `cd tiered/frontend/flex-sync-guides.tiered` and run `npm install`
9. In the same folder run `npm run demo`
10. Enter the folder `cd playground` and run `npm install`
11. In that same folder run `npm start`
