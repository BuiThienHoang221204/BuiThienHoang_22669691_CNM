# Hướng dẫn Deploy ứng dụng lên EC2 - Chi tiết từng bước

## 📋 Chuẩn bị

### 1. Cần có:
- ✅ EC2 instance đã được tạo
- ✅ Key pair (.pem file) để SSH vào EC2
- ✅ IAM Role đã được gắn vào EC2 instance
- ✅ DynamoDB table và S3 bucket đã được tạo

### 2. Thông tin cần biết:
- **EC2 Public IP**: `100.28.131.7`
- **EC2 Public DNS**: `ec2-100-28-131-7.compute-1.amazonaws.com`
- **Key pair file**: `haukey.pem` (nằm ở `/e/HK2_Nam4/CNM/`)
- **Username**: `ec2-user` (Amazon Linux 2023)
- **GitHub Repository**: `duchauuuuu/NguyenDucHau_lab03_aws`
- **IAM Role**: `hau14032004`
- **Region**: `us-east-1` (N. Virginia)

---

## 🔧 Bước 1: Kết nối vào EC2 Instance

### Trên Windows (Git Bash hoặc PowerShell):

```bash
# Di chuyển đến thư mục chứa file .pem
# Trong Git Bash, đường dẫn Windows E:\ sẽ là /e/
cd /e/HK2_Nam4/CNM

# Đặt quyền cho file key (chỉ cần làm 1 lần)
chmod 400 haukey.pem

# Kết nối vào EC2
# Thay YOUR_EC2_PUBLIC_IP bằng Public IP của EC2 instance của bạn
ssh -i haukey.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

**Ví dụ cụ thể với file haukey.pem:**
```bash
# Bước 1: Di chuyển đến thư mục chứa key
cd /e/HK2_Nam4/CNM

# Bước 2: Đặt quyền (chỉ cần làm 1 lần)
chmod 400 haukey.pem

# Bước 3: Kết nối vào EC2
ssh -i haukey.pem ec2-user@100.28.131.7
```

**Lần đầu kết nối sẽ hỏi xác nhận:**
```
The authenticity of host '100.28.131.7' can't be established...
Are you sure you want to continue connecting (yes/no)?
```
→ Gõ `yes` và nhấn Enter

**Lưu ý:**
- Nếu gặp lỗi "Connection timed out": Kiểm tra Security Group đã mở port 22 (SSH) chưa
- Nếu gặp lỗi "Permission denied": Đảm bảo đã chạy `chmod 400 haukey.pem`
- Public IP có thể thay đổi khi restart instance

---

## 📦 Bước 2: Cài đặt Node.js trên EC2

**⚠️ QUAN TRỌNG: Bước này chạy TRÊN EC2 (trong terminal SSH), KHÔNG phải trên máy local!**

Sau khi đã kết nối vào EC2 (bạn sẽ thấy prompt `[ec2-user@ip-172-31-65-214 ~]$`), chạy các lệnh sau:

### Cho Amazon Linux 2023 (AL2023):

```bash
# Cập nhật hệ thống
sudo dnf update -y

# Cài đặt Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

**Lưu ý:** Amazon Linux 2023 dùng `dnf` thay vì `yum`, nhưng lệnh `yum` vẫn hoạt động (alias của dnf).

### Cho Amazon Linux 2 (nếu dùng AMI cũ):

```bash
# Cập nhật hệ thống
sudo yum update -y

# Cài đặt Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

### Cho Ubuntu:

```bash
# Cập nhật hệ thống
sudo apt update

# Cài đặt Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

---

## 📤 Bước 3: Upload code lên EC2

Có 2 cách để upload code (khuyến nghị dùng Git):

### Cách 1: Sử dụng Git (Khuyến nghị - nhanh và tiện lợi)

**⚠️ Bước này chạy TRÊN EC2 (trong terminal SSH)!**

**Trên EC2:**
```bash
# Cài đặt Git (nếu chưa có)
sudo dnf install git -y

# Clone repository
cd ~
git clone https://<YOUR_GITHUB_TOKEN>@github.com/duchauuuuu/NguyenDucHau_lab03_aws.git
cd ~/product-manager

# Hoặc nếu dùng SSH
git clone git@github.com:your-username/your-repo.git
```

**Lưu ý:** GitHub không còn hỗ trợ password authentication, cần dùng Personal Access Token.

### Cách 2: Sử dụng SCP (từ máy local - Không khuyến nghị, chậm hơn)

**⚠️ Bước này chạy TRÊN MÁY LOCAL (Git Bash), không phải trên EC2!**

**Mở terminal mới trên máy local (Git Bash) và chạy:**
```bash
# Di chuyển đến thư mục dự án
cd /e/HK2_Nam4/CNM/22669691_BuiThienHoang/22669691_BuiThienHoang

# Upload toàn bộ thư mục dự án lên EC2
scp -i ../haukey.pem -r . ec2-user@100.28.131.7:/home/ec2-user/product-manager
```

**Lưu ý:** 
- Đảm bảo bạn đang ở trong thư mục dự án (22669691_BuiThienHoang)
- File `haukey.pem` nằm ở thư mục cha (CNM)
- Thay `100.28.131.7` bằng Public IP của bạn nếu khác
- Lệnh này sẽ upload code từ máy local lên EC2

**⚠️ Sau đó quay lại terminal EC2 (terminal SSH) và chạy:**
```bash
cd ~/product-manager
```

**Lưu ý:** GitHub không còn hỗ trợ password authentication, cần dùng Personal Access Token.

### Cách 2: Sử dụng WinSCP (Windows - Giao diện đồ họa - Tùy chọn)

1. Tải và cài WinSCP: https://winscp.net/
2. Mở WinSCP → New Session
3. Điền thông tin:
   - **File protocol**: SFTP
   - **Host name**: EC2 Public IP
   - **User name**: `ec2-user` (hoặc `ubuntu`)
   - **Private key file**: Chọn file .pem của bạn
4. Click **Login**
5. Kéo thả thư mục dự án từ bên trái (local) sang bên phải (EC2)

---

## ⚙️ Bước 4: Cài đặt Dependencies

**⚠️ Bước này chạy TRÊN EC2 (trong terminal SSH)!**

**Trên EC2:**
```bash
# Vào thư mục dự án
cd ~/product-manager
# hoặc
cd ~/product-manager

# Cài đặt dependencies
npm install
```

---

## 🔐 Bước 5: Tạo file .env trên EC2

**⚠️ Bước này chạy TRÊN EC2 (trong terminal SSH)!**

**Trên EC2:**
```bash
# Tạo file .env
nano .env
```

**Nhập nội dung sau (chỉ cần region, table, bucket, port - KHÔNG cần Access Keys):**
```env
AWS_REGION=us-east-1
DYNAMODB_TABLE=Products
S3_BUCKET_NAME=hau14032004
PORT=3000
```

**Lưu file:**
- Nhấn `Ctrl + O` để lưu
- Nhấn `Enter` để xác nhận
- Nhấn `Ctrl + X` để thoát

**Hoặc dùng lệnh echo (nhanh hơn):**
```bash
cat > .env << 'EOF'
AWS_REGION=us-east-1
DYNAMODB_TABLE=Products
S3_BUCKET_NAME=hau14032004
PORT=3000
EOF
```

**Kiểm tra file .env đã tạo đúng:**
```bash
cat .env
```

---

## 🚀 Bước 6: Chạy ứng dụng

**⚠️ Bước này chạy TRÊN EC2 (trong terminal SSH)!**

### Cách 1: Chạy trực tiếp (để test)

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://100.28.131.7:3000`

**Lưu ý:** Khi bạn đóng terminal, ứng dụng sẽ dừng.

### Cách 2: Sử dụng PM2 (Khuyến nghị - chạy nền)

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Chạy ứng dụng với PM2
pm2 start app.js --name product-manager

# Xem trạng thái
pm2 status

# Xem logs
pm2 logs product-manager

# Lưu cấu hình để tự động khởi động lại khi server reboot
pm2 save
pm2 startup

# Lệnh startup sẽ hiển thị một lệnh, copy và chạy nó
# Ví dụ: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

**Các lệnh PM2 hữu ích:**
```bash
pm2 restart product-manager  # Khởi động lại
pm2 stop product-manager     # Dừng
pm2 delete product-manager   # Xóa
pm2 monit                    # Monitor real-time
```

---

## 🔓 Bước 7: Mở Security Group (Firewall)

**⚠️ QUAN TRỌNG: Cần mở CẢ 2 ports:**
- **Port 22 (SSH)**: Để kết nối vào EC2
- **Port 3000 (Custom TCP)**: Để truy cập ứng dụng web

### Trên AWS Console:

1. Vào **EC2 Console** → **Instances**
2. Chọn instance của bạn (i-0780c2b10dfc84fea)
3. Vào tab **Security** → Click vào **Security groups**
4. Chọn Security group → **Edit inbound rules**
5. Thêm 2 rules:

   **Rule 1 - SSH:**
   - **Type**: SSH
   - **Port**: 22
   - **Source**: 0.0.0.0/0 (hoặc IP cụ thể của bạn để bảo mật hơn)
   - **Description**: SSH Access

   **Rule 2 - Web App:**
   - **Type**: Custom TCP
   - **Port range**: 3000
   - **Source**: 0.0.0.0/0 (hoặc IP cụ thể của bạn để bảo mật hơn)
   - **Description**: Node.js App

6. Click **Save rules**

**Lưu ý:** Có thể có nhiều rules cùng lúc, không ảnh hưởng lẫn nhau.

### Hoặc dùng AWS CLI (trên EC2):

```bash
# Lấy Security Group ID của instance
aws ec2 describe-instances --instance-ids i-xxxxxxxxx --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Thêm rule (thay YOUR_SG_ID bằng Security Group ID)
aws ec2 authorize-security-group-ingress \
    --group-id YOUR_SG_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0
```

---

## ✅ Bước 8: Kiểm tra ứng dụng

1. Mở trình duyệt
2. Truy cập: `http://100.28.131.7:3000`
   - Hoặc: `http://ec2-100-28-131-7.compute-1.amazonaws.com:3000`
3. Nếu thấy trang web với header "HỆ THỐNG QUẢN LÝ SẢN PHẨM" và "Nguyễn Đức Hậu", thành công!

**Nếu không truy cập được:**
- Kiểm tra Security Group đã mở **CẢ port 22 (SSH) VÀ port 3000 (Web)** chưa
- Kiểm tra ứng dụng đang chạy: `pm2 status`
- Xem logs: `pm2 logs product-manager`
- Kiểm tra firewall của OS: `sudo firewall-cmd --list-all` (Amazon Linux)

---

## 🔄 Cập nhật code sau này

### Cách 1: Dùng Git (Khuyến nghị)

**Bước 1: Push code mới lên GitHub (trên máy local - Git Bash):**
```bash
# Di chuyển đến thư mục dự án
cd /e/HK2_Nam4/CNM/22669691_BuiThienHoang/22669691_BuiThienHoang

# Kiểm tra các file đã thay đổi
git status

# Thêm tất cả file đã sửa
git add .

# Commit với message
git commit -m "Mô tả thay đổi"

# Push lên GitHub
git push origin main
```

**Bước 2: Pull code mới trên EC2 (trên EC2 - terminal SSH):**
```bash
# Vào thư mục dự án
cd ~/product-manager

# Pull code mới từ GitHub
git pull origin main

# Cài dependencies nếu có thay đổi
npm install  # Nếu có dependencies mới

# Restart PM2 để load code mới
pm2 restart product-manager

# Xem logs để kiểm tra
pm2 logs product-manager --lines 20
```

### Cách 2: Dùng SCP (nếu không dùng Git)

**Trên máy local (Git Bash):**
```bash
cd /e/HK2_Nam4/CNM/22669691_BuiThienHoang/22669691_BuiThienHoang
scp -i /e/HK2_Nam4/CNM/haukey.pem views/layout.ejs ec2-user@100.28.131.7:/home/ec2-user/product-manager/views/
```

**Trên EC2:**
```bash
cd ~/product-manager
pm2 restart product-manager
```

**Lưu ý:** PM2 không tự động phát hiện thay đổi code, cần restart sau mỗi lần cập nhật.

---

## 🐛 Xử lý lỗi thường gặp

### 1. Lỗi "Permission denied" khi SSH:
```bash
chmod 400 your-key.pem
```

### 2. Lỗi "Cannot find module":
```bash
npm install
```

### 3. Lỗi "Port 3000 already in use":
```bash
# Tìm process đang dùng port 3000
sudo lsof -i :3000
# Hoặc
sudo netstat -tulpn | grep 3000

# Kill process
sudo kill -9 PID
```

### 4. Lỗi AWS Credentials:
- Kiểm tra IAM Role đã được gắn vào EC2 chưa
- Kiểm tra IAM Role có đủ permissions (DynamoDB và S3)
- Không cần Access Keys trong .env nếu dùng IAM Role

### 5. Ứng dụng không truy cập được từ internet:
- Kiểm tra Security Group đã mở **CẢ port 22 (SSH) VÀ port 3000 (Web)** chưa
- Kiểm tra ứng dụng đang chạy: `pm2 status` (phải thấy status: online)
- Xem logs để tìm lỗi: `pm2 logs product-manager`
- Kiểm tra Public IP có thay đổi không (trong EC2 Console)
- Thử truy cập: `http://100.28.131.7:3000`

### 6. Lỗi "Connection timed out" khi SSH:
- Kiểm tra Security Group đã mở port 22 (SSH) chưa
- Kiểm tra Public IP có thay đổi không
- Kiểm tra Instance state phải là "Running"

### 7. Lỗi khi git pull (Authentication failed):
- GitHub không còn hỗ trợ password, cần dùng Personal Access Token
- Dùng token trong URL: `git clone https://TOKEN@github.com/username/repo.git`

---

## 📝 Checklist trước khi deploy

- [ ] EC2 instance đã được tạo
- [ ] IAM Role đã được tạo và gắn vào EC2
- [ ] DynamoDB table đã được tạo (tên: Products)
- [ ] S3 bucket đã được tạo (tên: hau14032004)
- [ ] Security Group đã mở **CẢ port 22 (SSH) VÀ port 3000 (Web)**
- [ ] Node.js đã được cài đặt trên EC2
- [ ] Code đã được upload lên EC2
- [ ] File .env đã được tạo (không có Access Keys)
- [ ] Dependencies đã được cài đặt (`npm install`)
- [ ] Ứng dụng đã được chạy với PM2
- [ ] Đã test truy cập từ browser

---

## 🎉 Hoàn thành!

Sau khi hoàn thành tất cả các bước, ứng dụng của bạn sẽ chạy trên EC2 và có thể truy cập từ internet tại:
```
http://100.28.131.7:3000
```

**Thông tin ứng dụng:**
- **URL**: http://100.28.131.7:3000
- **Header**: "HỆ THỐNG QUẢN LÝ SẢN PHẨM" - "Nguyễn Đức Hậu"
- **Footer**: "Nguyễn Đức Hậu - 22679541"
- **Giao diện**: Tông màu xanh dương (#1976d2) và trắng

**Lưu ý:** 
- Public IP có thể thay đổi khi restart instance. Nếu muốn IP cố định, sử dụng Elastic IP.
- Đảm bảo Security Group đã mở **CẢ port 22 (SSH) VÀ port 3000 (Web)** trước khi truy cập.
- Ứng dụng chạy với PM2, sẽ tự động khởi động lại khi server reboot.

---

## 📚 Phân biệt các terminal:

| Terminal | Prompt | Dùng để |
|----------|--------|---------|
| **Máy local (Git Bash)** | `ADMIN@DESKTOP-... MINGW64` | Sửa code, git push, upload code |
| **EC2 (SSH)** | `[ec2-user@ip-172-31-65-214 ~]$` | Cài đặt, chạy ứng dụng, quản lý PM2 |

**Quan trọng:** Luôn phân biệt rõ lệnh nào chạy ở đâu!
