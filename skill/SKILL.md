---
name: skill_truy_xuat_gg_sheet_doc
description: Sổ tay Quy trình Vận hành Chuẩn (SOP) 4 bước độc lập tra cứu, trinh sát, lọc tọa độ và rút trích dữ liệu Google Sheets & Excel (.xlsx, .xlsm, .xlsb, .xls, .csv, .ods), hỗ trợ lọc dữ liệu ẩn và bảo vệ PII.
version: 2.0.0
---

# QUY TRÌNH VẬN HÀNH CHUẨN (SOP): TRUY XUẤT DỮ LIỆU GOOGLE DRIVE, GOOGLE SHEETS & EXCEL

Sổ tay này hướng dẫn Đặc vụ Truy xuất Dữ liệu (`Agent Truy xuất GG Sheet + Doc`) vận hành chính xác chuỗi **4 Công Cụ Độc Lập** để định vị, trinh sát, lọc tọa độ và rút trích dữ liệu từ kho lưu trữ Google Drive / Google Sheets / Excel.

---

## 🛡️ NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN (SECURITY & PII FIRST)

1. **Bảo Mật Thông Tin Cá Nhân (PII - THIẾT GIÁP):**
   - BẮT BUỘC ẩn/xóa toàn bộ các cột dữ liệu nhạy cảm (Số điện thoại, CCCD, Lương, Tài khoản ngân hàng) trước khi chuyển dữ liệu cho các Agent khác hoặc hiển thị cho người dùng, trừ khi người dùng có quyền Giám đốc (`role_level >= 5`).
2. **Kho Lưu Trữ Trung Tâm (`ROOT_STORAGE_URL`):**
   - Luôn sử dụng biến môi trường `ROOT_STORAGE_URL` (`https://drive.google.com/drive/folders/YOUR_ROOT_STORAGE_FOLDER_ID`) làm thư mục gốc.

---

## 🔑 1. TRA CỨU MA TRẬN PHÂN QUYỀN (MUC_LUC_TAI_LIEU.JSON)

Trước khi kích hoạt chuỗi công cụ, Agent đối chiếu thông tin người dùng với file `Muc_Luc_Tai_Lieu.json`:
- **3 Biến đầu vào:**
  1. `role_level`: Cấp bậc người dùng (1 đến 5).
  2. `department`: Mã phòng ban (`IBB`, `USER`, `INF`, `CSKH`, `QA`, `HR` hoặc danh sách nhiều phòng ban).
  3. `department_id`: Mã khu vực / đơn vị con (`1`, `2`, `ALL` hoặc danh sách nhiều ID).
- **Cấu trúc Key tra cứu:** `LV{role_level}_DEPT_{department}_ID_{department_id}` (ví dụ: `LV3_DEPT_IBB_ID1`, `LV4_DEPT_INF_IDALL`).
- **Kết quả:** Danh sách `folder_id` mục tiêu, chủ đề (`topic`) và từ khóa gợi ý (`keywords`).

---

## 🛠️ 2. QUY TRÌNH VẬN HÀNH CHUẨN (SOP) 4 BƯỚC

```
[Bắt đầu yêu cầu]
       │
       ▼
1. Bước 1: Tìm File (Locate_File_In_Drive_Folder)
   - Input: department, keyword, role_level, department_id, root_storage_url
   - Output: file_id, file_name, file_type (google_sheet hoặc excel)
       │
       ▼
2. Bước 2: Trinh Sát Cấu Trúc File (Inspect_Sheet_Structure_Tool)
   - Input: file_id, file_type
   - Đặc điểm: Hỗ trợ .xlsx, .xlsm, .xlsb, .xls, .csv, .ods, .gsheet
   - Quy tắc: Lọc và loại bỏ hoàn toàn các Sheet ẩn, chỉ trả về danh sách Sheet hiển thị
   - Output: sheet_names (danh sách trang tính hiển thị), sheet_count, default_sheet
       │
       ▼
3. Bước 3: Lọc Tọa Độ Dữ Liệu (Scan_Sheet_Schema / Locate_Coordinates_Tool)
   - Input: file_id, sheet_name, target_keywords
   - Quy tắc: Lọc bỏ cột/hàng ẩn, ép kiểu toàn bộ Datetime về định dạng DD/MM/YYYY
   - Output: headers_json, suggested_range (vùng dữ liệu đã làm sạch), matched_columns
       │
       ▼
4. Bước 4: Rút Trích Dữ Liệu (GG_Sheet_Tool / Data_Extractor_Tool)
   - Input: file_id, sheet_name, sheet_range, target_columns, row_limit
   - Output: data_table (Bảng Markdown), data_json, total_rows
   - Quy tắc: Tổng hợp thành Bảng Markdown hoàn chỉnh và bảo vệ PII
```

---

## 🔄 3. VẬN HÀNH BĂNG CHUYỀN ĐA PHÒNG BAN (MULTI-DEPARTMENT PIPELINE)

Khi người dùng yêu cầu số liệu từ **nhiều phòng ban** hoặc **nhiều khu vực**:
1. Lập danh sách tất cả các `folder_id` từ `Muc_Luc_Tai_Lieu.json`.
2. Chạy tuần tự chuỗi 4 bước cho từng thư mục/phòng ban.
3. Gộp toàn bộ kết quả đã làm sạch thành một Bảng Markdown tổng hợp duy nhất.
4. Đưa ra nhận xét, đánh giá so sánh trực quan, chính xác.
