/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "oauth2": {
      "mappedFields": {
        "name": ""
      }
    }
  }, collection)

  // add field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "select1832264764",
    "maxSelect": 0,
    "name": "role_level",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Admin",
      "Manager",
      "Sale",
      "Technician",
      "CSKH"
    ]
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "select3441287562",
    "maxSelect": 0,
    "name": "department",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Kinh doanh",
      "Kỹ thuật",
      "CSKH",
      "Quản lý"
    ]
  }))

  // update field
  collection.fields.addAt(1, new Field({
    "cost": 0,
    "help": "",
    "hidden": true,
    "id": "password901924565",
    "max": 71,
    "min": 8,
    "name": "password",
    "pattern": "",
    "presentable": false,
    "required": true,
    "system": true,
    "type": "password"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 100,
    "min": 2,
    "name": "fullname",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "oauth2": {
      "mappedFields": {
        "name": "name"
      }
    }
  }, collection)

  // remove field
  collection.fields.removeById("select1832264764")

  // remove field
  collection.fields.removeById("select3441287562")

  // update field
  collection.fields.addAt(1, new Field({
    "cost": 0,
    "help": "",
    "hidden": true,
    "id": "password901924565",
    "max": 0,
    "min": 8,
    "name": "password",
    "pattern": "",
    "presentable": false,
    "required": true,
    "system": true,
    "type": "password"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 255,
    "min": 0,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
