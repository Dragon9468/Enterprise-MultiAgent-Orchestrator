/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("select1832264764")

  // add field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "number1832264764",
    "max": 5,
    "min": 1,
    "name": "role_level",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

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

  // remove field
  collection.fields.removeById("number1832264764")

  return app.save(collection)
})
