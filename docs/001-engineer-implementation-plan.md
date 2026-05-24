# Full-Stack Implementation Plan - FinSight AI

Dựa trên code Frontend hiện tại, đây là kế hoạch triển khai đồng bộ cả **Backend (NestJS)** và **Frontend (React)** để tạo thành các tính năng hoàn thiện.

## 1. Tech Stack
- **Backend**: NestJS, PostgreSQL, TypeORM, JWT, Passport.
- **Frontend**: React 19, Tailwind CSS, Axios, Socket.io-client.
- **AI Integration**: Google Gemini SDK (Gemini 3 Flash).

## 2. Database Schema (PostgreSQL) - [DONE]
*(Giữ nguyên các định nghĩa bảng đã triển khai)*

## 3. Implementation Roadmap (Lộ trình triển khai)

### Phase 1: Infrastructure & Foundation ✅
Mục tiêu: Thiết lập dự án NestJS và kết nối Database.
- [x] **Task 1.1**: Khởi tạo project NestJS, cài đặt TypeORM, PostgreSQL driver.
- [x] **Task 1.2**: Cấu hình biến môi trường (`ConfigModule`) cho DB, JWT, Gemini.
- [x] **Task 1.3**: Triển khai `BaseEntity` và thiết lập kết nối Database tự động.
- [x] **Task 1.4**: Cấu hình Logger và Global Exception Filter.

### Phase 2: Auth Module & Frontend Integration (Quản lý người dùng) ✅
Mục tiêu: Người dùng có thể Đăng ký/Đăng nhập và lưu Session trên FE.
- [x] **Task 2.1**: Tạo `UserEntity` (Backend).
- [x] **Task 2.2**: Triển khai Đăng ký & Hash password (Backend).
- [x] **Task 2.3**: Triển khai Đăng nhập & JWT (Backend).
- [x] **Task 2.4**: Tạo `JwtStrategy` và `AuthGuard` (Backend).
- [x] **Task 2.5**: Xây dựng trang Login/Register trên FE (nếu chưa có) và kết nối API.
- [x] **Task 2.6**: Quản lý JWT Token trong `localStorage` và Axios Interceptors ở FE.

### Phase 3: Financial Core Integration (Transactions & Assets) ✅
Mục tiêu: Đồng bộ dữ liệu tài chính giữa FE và DB.
- [x] **Task 3.1**: CRUD cho Transactions (Backend).
- [x] **Task 3.2**: CRUD cho Assets (Backend).
- [x] **Task 3.3**: Ownership Check & Validation (Backend).
- [x] **Task 3.4**: Cập nhật Dashboard FE để gọi API lấy danh sách Giao dịch/Tài sản thực tế.
- [x] **Task 3.5**: Tích hợp các Form thêm Giao dịch/Tài sản trên FE với Backend.

### Phase 4: AI Intelligence & Real-time Chat (Full Feature) ✅
Mục tiêu: Chat với AI, nhận diện ý định và cập nhật dữ liệu real-time.
- [x] **Task 4.1**: Triển khai `AiService` (NestJS) để giao tiếp với Gemini SDK.
- [x] **Task 4.2**: Xây dựng **Intent Recognizer** (Backend): Nhận diện ADD_TRANSACTION, UPDATE_ASSET, v.v.
- [x] **Task 4.3**: Thiết lập **WebSocket Gateway** (Backend) để stream chat.
- [x] **Task 4.4**: Cập nhật Chat UI trên FE sử dụng `socket.io-client` thay vì gọi trực tiếp Gemini.
- [x] **Task 4.5**: Tự động hóa: AI xác nhận hành động -> Backend thực thi -> FE cập nhật UI qua Socket.
- [x] **Task 4.6**: Lưu lịch sử chat vào DB và hiển thị lại khi tải trang.

### Phase 5: AI Insights & Final Polish
Mục tiêu: Phân tích dữ liệu và hoàn thiện trải nghiệm.
- [ ] **Task 5.1**: API `/ai/insights` (Backend) lấy dữ liệu thật từ DB để phân tích.
- [ ] **Task 5.2**: Hiển thị 3 Insights từ AI lên Dashboard FE dựa trên dữ liệu thật.
- [ ] **Task 5.3**: Kiểm thử E2E: Đăng nhập -> Chat thêm giao dịch -> Dashboard cập nhật số liệu.

---
**Lưu ý:** Chúng ta sẽ bắt đầu từ Phase 1 sau khi bản kế hoạch này được thông qua.
