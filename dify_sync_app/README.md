# Dify Sync App — Đồng Bộ DSL Trực Tiếp Lên Dify Self-Hosted

Công cụ CLI Python hỗ trợ tự động hóa việc đẩy các file quy trình Chatflow/Workflow (`.yml`) trực tiếp vào hệ thống **Dify Self-Hosted** thông qua Dify Console API (không cần thao tác thủ công trên giao diện web Studio).

---

## 🛠️ Yêu cầu môi trường

- **Python 3.9+**
- Thư viện cần thiết: `requests`, `ruamel.yaml` (hoặc `pyyaml`)
- Cài đặt thư viện:
  ```bash
  pip install requests ruamel.yaml
  ```

---

## ⚙️ Cấu hình thông tin đăng nhập

Có 3 cách để cung cấp thông tin đăng nhập:

### Cách 1: Cấu hình trực tiếp trong file `dify_sync.py` (Khuyên dùng cho máy cá nhân)
Mở file `dify_sync_app/dify_sync.py` và cập nhật biến `CONFIG`:
```python
CONFIG = {
    "base_url": "http://localhost",       # URL Dify của bạn (ví dụ: http://localhost hoặc http://192.168.1.50)
    "email":    "admin@domain.com",       # Email tài khoản Dify Console
    "password": "your_dify_password",    # Mật khẩu tài khoản Dify Console
}
```

### Cách 2: Sử dụng biến môi trường (Environment Variables)
```bash
# Windows PowerShell
$env:DIFY_URL="http://localhost"
$env:DIFY_EMAIL="admin@domain.com"
$env:DIFY_PASSWORD="your_dify_password"

# Linux / MacOS
export DIFY_URL="http://localhost"
export DIFY_EMAIL="admin@domain.com"
export DIFY_PASSWORD="your_dify_password"
```

### Cách 3: Truyền trực tiếp qua tham số dòng lệnh CLI
```bash
python dify_sync.py --list --url http://localhost --email admin@domain.com --password mypass
```

---

## 🚀 Hướng dẫn sử dụng

### 1. Xem danh sách các App hiện có trên Dify (để lấy App ID)
```bash
python dify_sync.py --list
```
*Kết quả mẫu:*
```text
--------------------------------------------------------------------------------
APP ID                                 MODE             TEN APP
--------------------------------------------------------------------------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890   advanced-chat    Primarch Perturabo (Kỹ thuật)
--------------------------------------------------------------------------------
Tong cong: 1 app(s)
```

---

### 2. Import file DSL `.yml` mới (Tạo App mới trên Dify)
```bash
python dify_sync.py --import ../chatflow/primarch_tech.yml
```

---

### 3. Cập nhật (Update) App đang có trên Dify bằng file `.yml` mới
Copy **APP ID** thu được từ lệnh `--list`, sau đó chạy:
```bash
python dify_sync.py --update <APP_ID> ../chatflow/primarch_tech.yml
```

---

### 4. Cập nhật và Tự động Publish luôn
```bash
python dify_sync.py --update <APP_ID> ../chatflow/primarch_tech.yml --publish
```

---

## 💻 Tính khả thi khi chạy trên máy khác (Cross-machine Compatibility)

**CÓ, SCRIPT NÀY HOẠT ĐỘNG HOÀN HẢO TRÊN MÁY KHÁC** khi đáp ứng các điều kiện sau:

1. **Dify phiên bản Self-Hosted (Docker):** Script hoạt động dựa trên endpoint Console API (`/console/api/login` & `/console/api/apps/...`) của Dify self-hosted.
2. **Cấu hình đúng `base_url`:** Nếu Dify chạy ở máy khác hoặc domain/port khác (ví dụ: `http://192.168.1.100` hay `http://localhost:8080`), chỉ cần sửa `base_url` hoặc truyền `--url`.
3. **Cài sẵn Python & `requests`:** Đảm bảo máy đích đã cài Python 3 và `pip install requests ruamel.yaml`.

---

## 📌 Nguyên tắc hoạt động (Workflow Policy)

- **Không tự động chạy ngầm:** Script `dify_sync.py` là công cụ thủ công / 1-lần (One-shot CLI tool). Agent sẽ **KHÔNG BAO GIỜ tự ý chạy ngầm** để ghi đè Chatflow/Workflow trên Dify.
- **Tùy chỉnh của User là ưu tiên 1:** Bạn hoàn toàn có thể tự vào Dify Studio chỉnh sửa sơ đồ Chatflow / Workflow theo ý muốn, sau đó Export file `.yml` đè lên file trong thư mục `chatflow/` hoặc `workflow/` để lưu giữ phiên bản hoàn chỉnh nhất.
- **Chỉ chạy khi có yêu cầu:** Agent chỉ thực hiện lệnh đẩy file khi bạn chủ động yêu cầu (ví dụ: *"Hãy đẩy file primarch_tech.yml lên Dify"*).
