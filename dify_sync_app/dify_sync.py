"""
dify_sync.py — Đồng bộ Chatflow/Workflow DSL trực tiếp lên Dify
=================================================================
Cách dùng:
  python dify_sync.py --list                          # Xem danh sách app hiện có
  python dify_sync.py --import ../chatflow/primarch_tech.yml  # Import DSL mới (tạo app mới)
  python dify_sync.py --update <APP_ID> ../chatflow/primarch_tech.yml  # Cập nhật app có sẵn

Cấu hình: Sửa phần CONFIG phía dưới hoặc dùng biến môi trường:
  DIFY_URL, DIFY_EMAIL, DIFY_PASSWORD
"""

import os
import sys
import base64
import json
import argparse
import requests
from pathlib import Path

# ─── CẤU HÌNH ─────────────────────────────────────────────────────────────────
CONFIG = {
    "base_url": os.environ.get("DIFY_URL", "http://localhost"),         # URL Dify của bạn
    "email":    os.environ.get("DIFY_EMAIL", "admin@example.com"),      # Điền email Dify vào đây
    "password": os.environ.get("DIFY_PASSWORD", "your_dify_password"),  # Điền password Dify vào đây
}
# ──────────────────────────────────────────────────────────────────────────────

# Ép stdout UTF-8 (Windows)
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


class DifyClient:
    """Console API client cho Dify self-hosted."""

    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
        self._access_token = None

    # ── Xác thực ──────────────────────────────────────────────────────────────

    def login(self) -> bool:
        """Đăng nhập vào Dify Console và lưu access token."""
        url = f"{self.base_url}/console/api/login"

        # Dify yêu cầu password được Base64-encode
        encoded_pw = base64.b64encode(self.password.encode()).decode()
        payload = {"email": self.email, "password": encoded_pw}

        print(f"Dang nhap toi {url} ...")
        try:
            resp = self.session.post(url, json=payload, timeout=15)
        except requests.exceptions.ConnectionError:
            print(f"Khong ket noi duoc toi {self.base_url}")
            print("   Kiem tra lai DIFY_URL trong phan CONFIG hoac bien moi truong.")
            return False

        if resp.status_code == 200:
            data = resp.json()
            token = data.get("data", {}).get("access_token") or data.get("access_token")

            if not token:
                token = self.session.cookies.get("access_token")

            if token:
                self._access_token = token
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                print("Dang nhap thanh cong!")

                csrf = self.session.cookies.get("csrf_token")
                if csrf:
                    self.session.headers.update({"X-CSRF-Token": csrf})
                return True
            else:
                print("Dang nhap OK nhung khong lay duoc token.")
                print(f"   Response: {resp.text[:300]}")
                return False
        else:
            print(f"Dang nhap that bai: {resp.status_code}")
            print(f"   {resp.text[:500]}")
            return False

    def _ensure_logged_in(self):
        if not self._access_token:
            if not self.login():
                sys.exit(1)

    # ── Danh sách App ─────────────────────────────────────────────────────────

    def list_apps(self, mode="all"):
        """Lấy danh sách app từ Dify Console (gồm cả workflow, chatflow và agent apps)."""
        self._ensure_logged_in()

        url = f"{self.base_url}/console/api/apps"
        params = {"page": 1, "limit": 100}
        if mode != "all":
            params["mode"] = mode

        resp = self.session.get(url, params=params, timeout=15)
        if resp.status_code != 200:
            print(f"Loi khi lay danh sach app: {resp.status_code} -- {resp.text[:300]}")
            return []

        apps = resp.json().get("data", [])
        
        # Nếu mode="all", lấy thêm danh sách Agent apps
        if mode == "all":
            agent_resp = self.session.get(url, params={"page": 1, "limit": 100, "mode": "agent"}, timeout=15)
            if agent_resp.status_code == 200:
                agent_apps = agent_resp.json().get("data", [])
                existing_ids = {a.get("id") for a in apps}
                for a in agent_apps:
                    if a.get("id") not in existing_ids:
                        apps.append(a)

        return apps

    def print_apps(self, apps):
        """Hiển thị danh sách app dạng bảng."""
        if not apps:
            print("Khong co app nao.")
            return

        print(f"\n{'─'*80}")
        print(f"{'APP ID':<38} {'MODE':<16} TEN APP")
        print(f"{'─'*80}")
        for app in apps:
            print(f"{app.get('id', ''):<38} {app.get('mode', ''):<16} {app.get('name', '')}")
        print(f"{'─'*80}")
        print(f"Tong cong: {len(apps)} app(s)\n")

    # ── Import DSL (tạo app mới) ──────────────────────────────────────────────

    def import_dsl(self, yml_path):
        """Import file DSL YAML → tạo app mới trên Dify."""
        self._ensure_logged_in()

        path = Path(yml_path)
        if not path.exists():
            print(f"File khong ton tai: {yml_path}")
            return None

        yaml_content = path.read_text(encoding="utf-8")
        url = f"{self.base_url}/console/api/apps/imports"

        payload = {
            "mode": "yaml-content",
            "yaml_content": yaml_content,
        }

        print(f"Dang import '{path.name}' len Dify ...")
        resp = self.session.post(url, json=payload, timeout=30)

        if resp.status_code in (200, 201):
            result = resp.json()
            app_id = result.get("app_id") or result.get("id", "")
            app_mode = result.get("app_mode", "")
            print(f"Import thanh cong!")
            print(f"   App ID   : {app_id}")
            print(f"   App Mode : {app_mode}")
            print(f"\nGhi nho App ID nay de dung lenh --update lan sau.")
            return result
        else:
            print(f"Import that bai: {resp.status_code}")
            print(f"   {resp.text[:600]}")
            return None

    # ── Update App hiện có ────────────────────────────────────────────────────

    def update_dsl(self, app_id, yml_path):
        """
        Cập nhật workflow/chatflow của app hiện có.
        Thử endpoint update-dsl trước, nếu không có thì push draft graph.
        """
        self._ensure_logged_in()

        path = Path(yml_path)
        if not path.exists():
            print(f"File khong ton tai: {yml_path}")
            return False

        yaml_content = path.read_text(encoding="utf-8")

        url_imports = f"{self.base_url}/console/api/apps/imports"
        payload = {
            "mode": "yaml-content",
            "yaml_content": yaml_content,
            "app_id": app_id,
        }

        print(f"Dang update app '{app_id}' tu '{path.name}' ...")
        resp = self.session.post(url_imports, json=payload, timeout=30)

        if resp.status_code in (200, 201):
            print(f"Update thanh cong qua endpoint /console/api/apps/imports (Status: 200 OK)!")
            return True

        print(f"Endpoint imports that bai ({resp.status_code}): {resp.text[:400]}. Thu phuong an draft push...")
        return self._push_workflow_draft(app_id, yaml_content)

    def _push_workflow_draft(self, app_id, yaml_content):
        """
        Fallback: Đẩy graph trực tiếp vào draft workflow của app qua
        PUT /console/api/apps/{id}/workflows/draft
        """
        try:
            from ruamel.yaml import YAML as RuamelYAML
            import io
            ry = RuamelYAML()
            data = ry.load(io.StringIO(yaml_content))
        except ImportError:
            try:
                import yaml as pyyaml
                data = pyyaml.safe_load(yaml_content)
            except Exception as e:
                print(f"Khong parse duoc YAML: {e}")
                return False
        except Exception as e:
            print(f"Loi parse YAML: {e}")
            return False

        graph = data.get("workflow", {}).get("graph", {})
        if not graph:
            print("Khong tim thay 'workflow.graph' trong file YAML.")
            return False

        # Lấy thông tin draft hiện tại để lấy hash / updated_at tránh 409 conflict
        url_draft = f"{self.base_url}/console/api/apps/{app_id}/workflows/draft"
        get_resp = self.session.get(url_draft, timeout=15)
        current_hash = None
        if get_resp.status_code == 200:
            draft_info = get_resp.json()
            current_hash = draft_info.get("hash") or draft_info.get("updated_at")

        graph_plain = json.loads(json.dumps(graph, default=str))
        env_vars = data.get("workflow", {}).get("environment_variables", [])
        features = data.get("workflow", {}).get("features", {})
        payload = {
            "graph": graph_plain,
            "environment_variables": json.loads(json.dumps(env_vars, default=str)),
            "features": json.loads(json.dumps(features, default=str))
        }
        if current_hash:
            payload["hash"] = current_hash

        resp = self.session.post(url_draft, json=payload, timeout=30)

        if resp.status_code in (200, 201):
            print(f"Draft push thanh cong! App da duoc cap nhat.")
            # Tu dong Publish
            pub_url = f"{self.base_url}/console/api/apps/{app_id}/workflows/publish"
            pub_resp = self.session.post(pub_url, json={}, timeout=15)
            if pub_resp.status_code in (200, 201):
                print("   Da tu dong Publish workflow thanh cong (Status: 200 OK)!")
            else:
                print(f"   Vao Dify Studio > app nay > nhan 'Publish' (HTTP {pub_resp.status_code}).")
            return True
        else:
            print(f"Draft push that bai: {resp.status_code}")
            print(f"   {resp.text[:600]}")
            print()
            print("Huong dan thu cong neu tat ca deu that bai:")
            print(f"   1. Mo Dify Studio -> app ID: {app_id}")
            print(f"   2. Nhan menu -> 'Import DSL'")
            print(f"   3. Chon file YML tuong ung")
            return False

    # ── Auto Sync (Tự tìm App ID & Sync) ───────────────────────────────────────

    def auto_sync(self, yml_path, publish=True):
        """Tự động tìm App ID trên Dify khớp với tên app trong file YAML để update, nếu chưa có thì import mới."""
        self._ensure_logged_in()
        path = Path(yml_path)
        if not path.exists():
            print(f"File khong ton tai: {yml_path}")
            return False

        yaml_content = path.read_text(encoding="utf-8")
        app_name = None
        try:
            import yaml as pyyaml
            parsed = pyyaml.safe_load(yaml_content)
            app_name = parsed.get("app", {}).get("name")
        except Exception:
            pass

        print(f"🔍 Dang tim app Dify khop voi '{path.name}' (Ten app trong YAML: '{app_name}')...")
        apps = self.list_apps()

        matched_app = None
        if app_name:
            for app in apps:
                if app.get("name") == app_name:
                    matched_app = app
                    break

        if not matched_app:
            stem = path.stem.lower()
            for app in apps:
                aname = app.get("name", "").lower()
                if ("tech" in stem or "kỹ thuật" in stem) and ("kỹ thuật" in aname or "perturabo" in aname):
                    matched_app = app
                    break
                elif ("cskh" in stem or "vulkan" in stem) and ("cskh" in aname or "vulkan" in aname):
                    matched_app = app
                    break
                elif ("manager" in stem or "guilliman" in stem) and ("quản lý" in aname or "guilliman" in aname):
                    matched_app = app
                    break
                elif ("sale" in stem or "corax" in stem) and ("sale" in aname or "corax" in aname):
                    matched_app = app
                    break

        if matched_app:
            app_id = matched_app["id"]
            print(f"🎯 Da tim thay App tren Dify: '{matched_app['name']}' (ID: {app_id})")
            success = self.update_dsl(app_id, yml_path)
            if success and publish:
                self.publish_app(app_id)
            return success
        else:
            print(f"➕ Khong tim thay App co san. Tien hanh import App moi...")
            res = self.import_dsl(yml_path)
            if res and publish:
                self.publish_app(res.get("id"))
            return bool(res)

    # ── Publish App ───────────────────────────────────────────────────────────

    def publish_app(self, app_id):
        """Publish draft workflow (tương đương bấm nút Publish trên Studio)."""
        self._ensure_logged_in()

        url = f"{self.base_url}/console/api/apps/{app_id}/workflows/publish"
        resp = self.session.post(url, json={}, timeout=15)

        if resp.status_code in (200, 201):
            print(f"🚀 App {app_id} da duoc Publish thanh cong!")
            return True
        else:
            print(f"⚠️  Publish status {resp.status_code}: {resp.text[:300]}")
            print(f"   Vao Studio de publish thu cong hoac kiem tra validation.")
            return False


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Dify DSL Sync Tool -- Dong bo Chatflow/Workflow len Dify",
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="""
Vi du:
  python dify_sync.py --auto ../chatflow/primarch_tech.yml   # AI Agent tu nhan dien app & cap nhat
  python dify_sync.py --list
  python dify_sync.py --import ../chatflow/primarch_tech.yml
  python dify_sync.py --update abc123def ../chatflow/primarch_tech.yml --publish
        """,
    )
    parser.add_argument("--auto",    dest="auto_file", metavar="FILE.yml",
                        help="Tu dong tim App ID tren Dify theo file YML & update/publish")
    parser.add_argument("--list",    action="store_true", help="Liet ke tat ca app tren Dify")
    parser.add_argument("--import",  dest="import_file", metavar="FILE.yml",
                        help="Import DSL YAML -> tao app moi")
    parser.add_argument("--update",  nargs=2, metavar=("APP_ID", "FILE.yml"),
                        help="Cap nhat app hien co theo App ID")
    parser.add_argument("--publish", action="store_true",
                        help="Tu dong Publish sau khi update (dung cung --update)")
    parser.add_argument("--url",     help="Override DIFY_URL")
    parser.add_argument("--email",   help="Override DIFY_EMAIL")
    parser.add_argument("--password",help="Override DIFY_PASSWORD")

    args = parser.parse_args()

    cfg = dict(CONFIG)
    if args.url:      cfg["base_url"] = args.url
    if args.email:    cfg["email"]    = args.email
    if args.password: cfg["password"] = args.password

    if not args.email and not args.password:
        if cfg["email"] == "your@email.com" or cfg["password"] == "your_password" or not cfg["email"]:
            print("Chua cau hinh email/password!")
            print("   Sua phan CONFIG trong file dify_sync.py")
            print("   hoac dung bien moi truong: DIFY_EMAIL, DIFY_PASSWORD")
            print("   hoac dung tham so: --email xxx --password yyy")
            sys.exit(1)

    client = DifyClient(cfg["base_url"], cfg["email"], cfg["password"])

    if args.auto_file:
        client.login()
        client.auto_sync(args.auto_file, publish=True)

    elif args.list:
        client.login()
        apps = client.list_apps()
        client.print_apps(apps)

    elif args.import_file:
        client.login()
        client.import_dsl(args.import_file)

    elif args.update:
        app_id, yml_file = args.update
        client.login()
        success = client.update_dsl(app_id, yml_file)
        if success and args.publish:
            client.publish_app(app_id)

    else:
        parser.print_help()
        print("\nGoi y: Bat dau bang lenh --list de xem danh sach App ID hien co.")


if __name__ == "__main__":
    main()
