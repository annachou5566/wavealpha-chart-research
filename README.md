# WaveAlpha Chart Research

Ngày nghiên cứu: **22/10/2026, Asia/Saigon**. Phiên bản nền: **0.1.0**.

Mục tiêu đã ghi nhận: xây dựng một phần mềm chart độc lập, hướng tới phạm vi chức năng tương đương TradingView, trong repository riêng để nghiên cứu lâu dài; sau đó chỉ đưa những cải tiến đã kiểm chứng vào WaveAlpha.

**Đây là repository nghiên cứu và các module nền ban đầu, chưa phải phần mềm chart hoàn chỉnh.** Không chứa mã nguồn, bundle, source map, binary, hình ảnh hoặc font độc quyền của TradingView. Không chứa source của repo WaveAlpha riêng tư; chỉ có mô tả và tham chiếu chính xác.

## Đọc theo thứ tự

1. [Báo cáo nghiên cứu](docs/TRADINGVIEW_REVERSE_ENGINEERING_REPORT.md).
2. [Kiến trúc được xác minh](docs/TRADINGVIEW_ARCHITECTURE_FINDINGS.md).
3. [Danh mục bằng chứng](docs/REVERSE_ENGINEERING_EVIDENCE_INDEX.md).
4. [Khoảng cách với WaveAlpha](docs/TRADINGVIEW_FEATURE_GAP_ANALYSIS.md).
5. [Kế hoạch cải tiến](docs/WAVEALPHA_CHART_IMPROVEMENT_PLAN.md).
6. [Checkpoint và điểm tiếp tục](docs/WAVEALPHA_IMPLEMENTATION_CHECKPOINT.md).
7. [Phạm vi xây dựng phần mềm đầy đủ](docs/FULL_PRODUCT_SCOPE.md).

## Đã có gì chạy được

- `src/action-gate.mjs`: hợp đồng chặn thao tác Drawing/Indicator/Workspace, gom popup đăng nhập, kiểm tra lại account/context.
- `src/drawing-document.mjs`: tài liệu drawing theo owner/workspace/symbol/timeframe, thêm/sửa/xóa, undo/redo, serialize/parse và kiểm tra owner.
- `src/save-coordinator.mjs`: một luồng ghi CAS, operation ID giữ nguyên khi retry, ACK đúng revision, coalesce thay đổi đang chờ, chặn conflict và ACK từ phiên cũ.
- `src/geometry.mjs`: chuyển tọa độ hai chiều, khoảng cách đoạn thẳng, snap OHLC theo khoảng cách pixel.
- `src/indicators.mjs`: SMA, EMA và Wilder RSI; warmup trả `null`, dữ liệu không hợp lệ bị từ chối.
- 30 kiểm thử hợp đồng độc lập đã PASS bằng Node 24.19.0.

Những module này chưa gắn vào UI, IndexedDB, server, nguồn giá thật hoặc WaveAlpha. `SaveCoordinator` là hợp đồng client với adapter được tiêm vào, không phải triển khai backend CAS. `DrawingDocument` hiện chỉ quản lý bộ nhớ và JSON, chưa tự lưu bền. `ActionGate` là cổng thao tác UI, không thay thế xác thực/phân quyền server.

## Kiểm tra trên Node hoặc Termux có Node >=22

```bash
npm test
npm run check
```

Các kiểm thử không cần cài dependency, không gọi mạng, không đọc tài khoản hay dữ liệu thật. Chưa kiểm thử trực tiếp trên Android/Termux. Không có ứng dụng desktop hoặc web UI để khởi chạy trong phiên bản này.

## Bằng chứng và công cụ

`evidence/` chứa SHA-256 bộ cài, inventory ASAR, metadata source map/module graph, kết quả test; không chứa `sourcesContent`. Các đường dẫn module và import graph là metadata phân tích tĩnh, không chứng minh tất cả nhánh runtime đã chạy. [Danh mục bằng chứng](docs/REVERSE_ENGINEERING_EVIDENCE_INDEX.md) giải thích giới hạn.

`tools/inspect_asar.py` là công cụ tự viết bằng Python chuẩn để đọc ASAR và kiểm tra SHA-256 khai báo. Chỉ dùng với bộ cài do người nghiên cứu tự cung cấp, trong một thư mục trích xuất riêng. Không chạy binary mục tiêu.

## Repository và phạm vi công khai

Repository: https://github.com/annachou5566/wavealpha-chart-research. Chủ dự án đã tạo repo; metadata GitHub xác nhận repo hiện là **Public**. Bản này chỉ công bố source độc lập và nghiên cứu TradingView. Các checkpoint, Git blob identities, cấu hình, topology, hostname và trạng thái vận hành của dự án WaveAlpha riêng tư không được đưa vào repo này.

Bản source này được công bố bằng commit mới kế thừa commit README ban đầu của repo GitHub. Không đẩy lịch sử Git cục bộ của gói nghiên cứu đầy đủ, vì lịch sử đó chứa tài liệu nội bộ. Không có workflow CI, deploy hoặc thay đổi hệ thống WaveAlpha từ bản công bố này.

Mã trong `src/`, `tests/` và công cụ tự viết là triển khai mới theo đặc tả hành vi chung. Bản phát hành này chưa gán giấy phép nguồn mở; chủ repository quyết định giấy phép trước khi chia sẻ ra ngoài.
