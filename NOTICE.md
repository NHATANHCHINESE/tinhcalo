# Bếp nhỏ

Ảnh chụp được xử lý trên thiết bị. Ảnh thu nhỏ và nhật ký lưu trong IndexedDB của trình duyệt. Bảng calo là giá trị tham khảo có thể chỉnh theo nhãn hoặc công thức thực tế.

## Thành phần

- Bộ phân loại món ăn [Google AIY Food V1](https://www.kaggle.com/models/google/aiy/tfLite/vision-classifier-food-v1/1) của Google. Mô hình MobileNet đưa ra gợi ý cho một món trong mỗi ảnh.
- [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe), phiên bản 0.10.22-rc.20250304. Mã nguồn MediaPipe sử dụng giấy phép Apache 2.0.
- [Ảnh minh họa bữa ăn trên Unsplash](https://images.unsplash.com/photo-1547592180-85f173990554).
- Minh họa linh vật ăn salad và cầm kính lúp được trích từ ảnh giới thiệu chính thức của [INOUT trên App Store](https://apps.apple.com/us/app/inout-calorie-counter/id1599210729), dùng trong bản cá nhân riêng tư theo yêu cầu.
- Phông Nunito đi kèm giấy phép trong dist/art/OFL.txt.
