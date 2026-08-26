/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

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
      "Kỹ thuật (NVKT)",
      "Kinh doanh (Sales)",
      "Chăm sóc Khách hàng (CSKH)",
      "Thu ngân / Quầy giao dịch",
      "Chuyên viên Kỹ thuật Hệ thống",
      "Chuyên viên Kinh doanh Dự án",
      "Chuyên viên Quản trị Chất lượng",
      "Điều hành Kỹ thuật Khu vực",
      "Trưởng nhóm Kinh doanh",
      "Trưởng nhóm Chăm sóc Khách hàng",
      "Phòng Kỹ thuật (TIN/PNC)",
      "Phòng Kinh doanh",
      "Phòng Chăm sóc Khách hàng",
      "Phòng Kế toán - Tổng hợp",
      "Ban Giám Đốc Chi Nhánh",
      "Phó Giám Đốc Chi Nhánh",
      "Ban Công nghệ & Hạ tầng Hệ thống (IT/Infra)",
      "Ban Quản trị Tối cao"
    ]
  }))

  return app.save(collection)
})
