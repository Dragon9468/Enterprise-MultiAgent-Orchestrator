/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "number1832264764",
    "max": 7,
    "min": 1,
    "name": "role_level",
    "onlyInt": true,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "select3441287562",
    "maxSelect": 1,
    "name": "department",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Kinh doanh",
      "Kỹ thuật",
      "CSKH",
      "Kỹ thuật Dự án",
      "Kinh doanh Dự án",
      "Quản lý Chất lượng",
      "Điều hành Kỹ thuật Khu vực",
      "Trưởng nhóm Kinh doanh",
      "Trưởng nhóm CSKH",
      "Trưởng phòng Kỹ thuật",
      "Trưởng phòng Kinh doanh",
      "Trưởng phòng CSKH",
      "Giám đốc Chi nhánh",
      "Ban Công Nghệ & Hạ tầng",
      "Quản Trị Viên"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "number1832264764",
    "max": 7,
    "min": 1,
    "name": "role_level",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
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

  return app.save(collection)
})
