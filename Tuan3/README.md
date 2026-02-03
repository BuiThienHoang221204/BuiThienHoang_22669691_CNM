# Ứng dụng Web Quản lý Sản phẩm

Ứng dụng web quản lý sản phẩm sử dụng Node.js, Express, EJS, DynamoDB và AWS S3, triển khai trên Amazon EC2.

## 📋 Mô tả

Ứng dụng cho phép quản lý danh sách sản phẩm với các chức năng CRUD (Create, Read, Update, Delete):
- **Create**: Thêm sản phẩm mới với hình ảnh
- **Read**: Xem danh sách sản phẩm
- **Update**: Chỉnh sửa thông tin sản phẩm
- **Delete**: Xóa sản phẩm (bao gồm xóa hình ảnh trên S3)

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express
- **Frontend**: EJS, HTML, CSS
- **Database**: Amazon DynamoDB (NoSQL)
- **Storage**: Amazon S3 (lưu trữ hình ảnh)
- **Cloud**: Amazon EC2 (triển khai ứng dụng)
- **SDK**: AWS SDK for JavaScript v3

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd 22669691_BuiThienHoang
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin AWS của bạn:

```env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
DYNAMODB_TABLE=Products
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

### 4. Tạo DynamoDB Table

Trên AWS Console, tạo DynamoDB table với:
- **Table name**: `Products` (hoặc tên bạn đã cấu hình trong .env)
- **Partition key**: `id` (String)
- **Settings**: Default settings

### 5. Tạo S3 Bucket

Trên AWS Console, tạo S3 bucket:
- **Bucket name**: Tên bucket của bạn
- **Region**: Cùng region với DynamoDB
- **Public access**: Có thể cấu hình để public read cho hình ảnh
- **CORS**: Cấu hình nếu cần

### 6. Cấu hình IAM Permissions

Đảm bảo IAM user/role có các quyền:
- `AmazonDynamoDBFullAccess` (hoặc quyền cụ thể cho table Products)
- `AmazonS3FullAccess` (hoặc quyền cụ thể cho bucket)

## 🚀 Chạy ứng dụng

### Chạy local

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Chạy trên EC2

1. **Kết nối EC2 instance**:
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

2. **Cài đặt Node.js** (nếu chưa có):
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

3. **Clone và cài đặt**:
```bash
git clone <repository-url>
cd 22669691_BuiThienHoang
npm install
```

4. **Cấu hình .env** hoặc sử dụng IAM Role

5. **Chạy ứng dụng**:
```bash
npm start
```

6. **Sử dụng PM2 để chạy nền** (khuyến nghị):
```bash
npm install -g pm2
pm2 start app.js --name product-manager
pm2 save
pm2 startup
```

7. **Cấu hình Security Group**: Mở port 3000 (hoặc port bạn đã cấu hình)

## 📁 Cấu trúc dự án

```
22669691_BuiThienHoang/
├── app.js                 # File chính của ứng dụng
├── controllers/           # Controllers xử lý logic
│   └── product.controller.js
├── routes/                # Định nghĩa routes
│   └── product.routes.js
├── services/              # Services cho AWS
│   ├── dynamodb.service.js
│   └── s3.service.js
├── views/                 # EJS templates
│   ├── layout.ejs
│   ├── footer.ejs
│   └── products/
│       ├── list.ejs
│       ├── create.ejs
│       └── edit.ejs
├── public/                # Static files
│   └── css/
│       └── style.css
├── uploads/              # Thư mục tạm cho upload (tự động xóa)
├── .env                  # Biến môi trường (không commit)
├── .env.example          # Template cho .env
├── .gitignore
├── package.json
└── README.md
```

## 🗄️ Thiết kế Database

### DynamoDB Table: Products

| Thuộc tính | Kiểu dữ liệu | Mô tả |
|------------|--------------|-------|
| id | String (Partition Key) | Mã sản phẩm (UUID) |
| name | String | Tên sản phẩm |
| price | Number | Giá sản phẩm |
| quantity | Number | Số lượng tồn kho |
| url_image | String | Đường dẫn hình ảnh (S3 URL) |

## 🔧 Các chức năng

### 1. Create - Thêm sản phẩm
- Nhập thông tin: tên, giá, số lượng
- Upload hình ảnh lên S3
- Lưu thông tin vào DynamoDB

### 2. Read - Xem danh sách
- Hiển thị danh sách sản phẩm dạng bảng
- Hiển thị hình ảnh, tên, giá, số lượng

### 3. Update - Cập nhật sản phẩm
- Chỉnh sửa tên, giá, số lượng
- Có thể thay đổi hình ảnh
- Tự động xóa ảnh cũ trên S3 khi có ảnh mới

### 4. Delete - Xóa sản phẩm
- Xóa sản phẩm theo ID
- Tự động xóa hình ảnh liên quan trên S3

## 🔒 Bảo mật

- Không commit file `.env` chứa thông tin nhạy cảm
- Sử dụng IAM Role trên EC2 thay vì Access Keys khi có thể
- Cấu hình Security Group chỉ mở port cần thiết
- Validate input từ phía server

## 📝 Scripts

- `npm start`: Chạy ứng dụng với Node.js

## 🐛 Xử lý lỗi

Ứng dụng có xử lý lỗi cơ bản. Kiểm tra console logs để debug.

## 📄 License

ISC

## 👤 Tác giả

22679541 - Nguyễn Đức Hậu

---

**Lưu ý**: Đảm bảo bạn đã cấu hình đúng AWS credentials và permissions trước khi chạy ứng dụng.
