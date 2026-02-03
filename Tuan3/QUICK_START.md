# ⚡ QUICK START - Setup Nhanh Trên AWS EC2

> Hướng dẫn setup nhanh hệ thống Product Management Extended trong 15 phút

## 📋 YÊU CẦU
- ✅ AWS Account
- ✅ AWS CLI đã cài đặt và cấu hình
- ✅ SSH client (Git Bash / Terminal)
- ✅ Đã có EC2 key pair

---

## 🚀 SETUP NHANH (15 PHÚT)

### Bước 1: Tạo DynamoDB Tables (2 phút)

```bash
# Set region
export AWS_REGION=us-east-1

# Tạo 4 tables cùng lúc
aws dynamodb create-table --table-name Users --attribute-definitions AttributeName=userId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $AWS_REGION

aws dynamodb create-table --table-name Categories --attribute-definitions AttributeName=categoryId,AttributeType=S --key-schema AttributeName=categoryId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $AWS_REGION

aws dynamodb create-table --table-name Products --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $AWS_REGION

aws dynamodb create-table --table-name ProductLogs --attribute-definitions AttributeName=logId,AttributeType=S --key-schema AttributeName=logId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $AWS_REGION

# Kiểm tra
aws dynamodb list-tables --region $AWS_REGION
```

### Bước 2: Tạo S3 Bucket (1 phút)

```bash
# Thay YOUR_NAME bằng tên của bạn
export BUCKET_NAME=product-app-YOUR_NAME

aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Public access
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Bucket policy
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
  }]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json
```

### Bước 3: Tạo IAM Role (2 phút)

```bash
# Trust policy
cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Tạo role
aws iam create-role --role-name EC2-ProductApp-Role --assume-role-policy-document file:///tmp/trust-policy.json

# Permissions policy
cat > /tmp/permissions.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:*"],
      "Resource": "arn:aws:dynamodb:$AWS_REGION:*:table/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::$BUCKET_NAME", "arn:aws:s3:::$BUCKET_NAME/*"]
    }
  ]
}
EOF

aws iam put-role-policy --role-name EC2-ProductApp-Role --policy-name DynamoDB-S3-Access --policy-document file:///tmp/permissions.json

# Instance profile
aws iam create-instance-profile --instance-profile-name EC2-ProductApp-Profile
aws iam add-role-to-instance-profile --instance-profile-name EC2-ProductApp-Profile --role-name EC2-ProductApp-Role
```

### Bước 4: Launch EC2 (Manual - 3 phút)

**Từ AWS Console:**

1. EC2 → Launch Instance
2. Name: `ProductApp-Server`
3. AMI: **Amazon Linux 2023** hoặc **Ubuntu 22.04**
4. Instance type: **t2.micro**
5. Key pair: Chọn key pair của bạn
6. Network: 
   - Auto-assign public IP: **Enable**
   - Security group: Tạo mới với rules:
     - SSH (22): My IP
     - HTTP (80): Anywhere
     - Custom TCP (3000): Anywhere
7. **Advanced details:**
   - IAM instance profile: `EC2-ProductApp-Profile` ⭐
8. **Launch**

### Bước 5: SSH và Cài đặt (5 phút)

```bash
# SSH vào EC2 (thay your-key.pem và EC2_IP)
chmod 400 your-key.pem
ssh -i "your-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

**Trên EC2:**

```bash
# Update
sudo yum update -y  # Amazon Linux
# hoặc: sudo apt update && sudo apt upgrade -y  # Ubuntu

# Cài Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git
# hoặc Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs git

# Cài PM2
sudo npm install -g pm2

# Verify
node -v && npm -v && git --version
```

### Bước 6: Deploy App (2 phút)

```bash
# Clone repo
cd ~
git clone https://github.com/BuiThienHoang221204/BuiThienHoang_22669691_CNM.git
cd BuiThienHoang_22669691_CNM/Tuan3

# Cấu hình .env
cat > .env << 'EOF'
AWS_REGION=us-east-1
DYNAMODB_TABLE=Products
DYNAMODB_USERS_TABLE=Users
DYNAMODB_CATEGORIES_TABLE=Categories
DYNAMODB_PRODUCT_LOGS_TABLE=ProductLogs
S3_BUCKET_NAME=product-app-YOUR_NAME
PORT=3000
NODE_ENV=production
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
EOF

# Tạo session secret ngẫu nhiên
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
sed -i "s/CHANGE_THIS_TO_RANDOM_STRING/$SECRET/" .env

# Thay YOUR_NAME bằng bucket name của bạn
nano .env  # Sửa S3_BUCKET_NAME

# Install dependencies
npm install

# Test chạy
npm start
# Ctrl+C để stop

# Deploy với PM2
pm2 start app.js --name product-app
pm2 save
pm2 startup  # Copy và chạy command được suggest

# View logs
pm2 logs
```

### Bước 7: Tạo Admin User (1 phút)

```bash
# Chạy script tạo admin
node scripts/create-admin.js

# Output:
# ✅ Tạo admin user thành công!
# Username: admin
# Password: admin123
```

### Bước 8: Tạo Dữ Liệu Mẫu (Optional)

```bash
node scripts/create-sample-data.js
```

---

## ✅ KIỂM TRA

1. **Mở browser:** `http://<EC2_PUBLIC_IP>:3000`
2. **Redirect đến login:** `http://<EC2_PUBLIC_IP>:3000/auth/login`
3. **Đăng nhập:**
   - Username: `admin`
   - Password: `admin123`
4. **Kiểm tra các chức năng:**
   - [ ] Xem danh sách sản phẩm
   - [ ] Thêm sản phẩm (với upload ảnh)
   - [ ] Sửa sản phẩm
   - [ ] Xóa sản phẩm (soft delete)
   - [ ] Quản lý categories
   - [ ] Xem inventory status
   - [ ] Tìm kiếm và lọc
   - [ ] Xem logs

---

## 🔧 TROUBLESHOOTING

### ❌ Không kết nối được EC2

```bash
# Kiểm tra Security Group
aws ec2 describe-security-groups --group-ids <SG_ID>

# Thêm rule cho port 3000
aws ec2 authorize-security-group-ingress --group-id <SG_ID> --protocol tcp --port 3000 --cidr 0.0.0.0/0
```

### ❌ Lỗi DynamoDB Access Denied

```bash
# Kiểm tra IAM role của instance
aws ec2 describe-instances --instance-ids <INSTANCE_ID> --query 'Reservations[0].Instances[0].IamInstanceProfile'

# Attach lại nếu thiếu
aws ec2 associate-iam-instance-profile --instance-id <INSTANCE_ID> --iam-instance-profile Name=EC2-ProductApp-Profile
```

### ❌ Upload ảnh không hoạt động

```bash
# Kiểm tra bucket policy
aws s3api get-bucket-policy --bucket <BUCKET_NAME>

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://<BUCKET_NAME>/
```

### ❌ PM2 không start

```bash
# Xem logs
pm2 logs product-app --lines 100

# Restart
pm2 restart product-app

# Kill và start lại
pm2 delete product-app
pm2 start app.js --name product-app
```

---

## 🎯 NEXT STEPS

### 1. Setup Nginx (Production)

```bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

sudo nano /etc/nginx/conf.d/product-app.conf
```

```nginx
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Truy cập: `http://<EC2_IP>` (không cần port)

### 2. Đổi mật khẩu admin

Đăng nhập → Tạo admin mới → Xóa admin mặc định

### 3. Tạo staff user để test phân quyền

Admin panel → Register → Role: staff

### 4. Backup DynamoDB

```bash
aws dynamodb update-continuous-backups \
  --table-name Products \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 📊 KIẾN TRÚC HOÀN CHỈNH

```
Internet
   |
   v
EC2 (Nginx → Node.js App)
   |
   +---> DynamoDB (4 tables)
   |        - Users
   |        - Categories  
   |        - Products
   |        - ProductLogs
   |
   +---> S3 (Images)
   |
   +---> CloudWatch (Logs/Metrics)
```

---

## 📚 DOCUMENT REFERENCES

- **Chi tiết:** `AWS_SETUP_EXTENDED.md`
- **API:** Xem `controllers/` và `routes/`
- **Database:** Xem `repositories/`

---

## ✨ TỔNG KẾT

**Thời gian setup:** ~15 phút  
**Cost:** ~$5-10/tháng (Free tier: $0)  
**Scalability:** ⭐⭐⭐⭐⭐  
**Production-ready:** ✅  

**Bây giờ bạn đã có:**
- ✅ Full authentication & authorization
- ✅ Category management
- ✅ Advanced product search/filter
- ✅ Inventory tracking
- ✅ Audit logs
- ✅ Soft delete
- ✅ Cloud-native với AWS

🎉 **Chúc mừng! Hệ thống đã sẵn sàng!**
