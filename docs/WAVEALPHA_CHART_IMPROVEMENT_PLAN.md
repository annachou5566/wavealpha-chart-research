# Kế hoạch chart độc lập — bản công khai

Ngày: 22/10/2026. Repository nghiên cứu có code và đặc tả công khai. Những file/module, checkpoint và gate riêng của hệ thống WaveAlpha đang hoạt động được giữ ở source of truth riêng; tài liệu này không thay thế chúng.

## Trạng thái nền

Đã phân tích ba installer và ranh giới desktop/web, viết năm module reference độc lập và chạy 30 test PASS. Chưa tích hợp vào WaveAlpha, chưa có UI chart, renderer, local durable storage, cloud server hoặc dữ liệu thị trường thật.

## A. Tool discovery và action gate

**Problem:** guest phải nhìn thấy đầy đủ tools, chỉ được dùng chức năng cần tài khoản sau login và storage reconciliation. **Evidence:** TV13 là modal desktop new-tab; toàn bộ luồng chart web chưa được tái kiểm thử. Yêu cầu catalog Drawing/Indicator là đặc tả chủ dự án, không phải kết luận từ source chart chưa có.

**Root cause hiện tại của repo nghiên cứu:** mới có action contract, chưa có catalog/UI để sử dụng. Không công bố root cause của hệ thống WaveAlpha riêng tư.

**Architecture:** data-only catalog → toolbar renderer → ActionGate → UI login hoặc trạng thái storage → command có owner/context fence. Không auto-replay tool sau login nếu chart đã đổi. Guest click không được đọc private documents hoặc tạo draft giả.

**Files mới:** `src/action-gate.mjs` đã có; catalog renderer, login view và adapter chưa có. **Compatibility/migration:** không migration dữ liệu WaveAlpha; không coi prototype JSON là định dạng thay thế. **Tests:** guest click/touch/shortcut/favorite; popup single-flight; đúng focus/Escape; signed-in-but-pending storage; account/context thay đổi giữa await. **Performance:** đo lazy bytes, open latency và idle work khi UI có thật. **Rollback:** revert riêng UI adapter/catalog; không thay schema.

## B. Drawing document và durable save

**Problem:** vẽ/xóa tự lưu, không cần nút Lưu cho từng hình; saved chỉ được hiển thị sau matching ACK. **Evidence:** TV08–10 là callback save/timeout của desktop; cloud drawing transaction/backend UNKNOWN.

**Root cause hiện tại:** reference modules mới ở memory/client contract, chưa có durable store hay server. **Architecture:** gesture transaction → DrawingDocument → durable journal theo owner/workspace/context → một SaveCoordinator → server owner authorization/CAS/idempotency → ACK. Retry giữ nguyên operation ID/body. Conflict không tự ghi đè. Xóa cuối giữ snapshot mảng rỗng.

**Files:** `src/drawing-document.mjs`, `src/save-coordinator.mjs` đã có. IndexedDB adapter, recovery escrow, server handler và UI status chưa có. **Data compatibility:** schema 1 của reference không được áp vào legacy data thật. **Migration:** chưa có; nếu cần sau này phải inventory, backup, conversion và roundtrip trước. **Tests:** retry cùng payload, invalid ACK, edit in-flight, reentrant flush, account-switch stale completion, 409 freeze; tiếp theo thêm crash/reload/transaction/2-tab integration. **Performance:** bounded writes và command coalescing, không poller thứ hai. **Rollback:** bảo toàn journal/last-good, không sửa data để khớp test.

`connect()` thay snapshot đang giữ trong memory; lớp tích hợp phải escrow dirty/pending state trước reconcile/account switch. Hiện không có bảo đảm sống qua tab close/crash, và không được gọi đây là durable recovery PASS.

## C. Renderer và numerical contracts

**Problem:** world/screen coordinates đúng, pan/zoom/crosshair mượt, indicator math xác định. **Evidence:** chart core TradingView chưa có implementation trong tập khảo sát; không gán Canvas/WebGL/dirty-region cho họ.

**Root cause hiện tại:** repo mới chưa có renderer. **Architecture:** một renderer owner, viewport transforms, tách data/document/presentation, dirty invalidation và frame coalescing sau đo; một command mỗi gesture. Không dựng thêm render loop song song.

**Files:** `src/geometry.mjs`, `src/indicators.mjs` đã có; renderer, gesture engine, pane registry và incremental stream adapter chưa có. **Compatibility:** không đổi hệ thống WaveAlpha. **Tests:** coordinate roundtrip, degenerate geometry, snap pixel threshold, SMA/EMA/RSI warmup; tiếp theo log axis, sessions, historical correction, DPI resize, many-pane browser. **Migration:** không có ở giai đoạn này. **Performance:** đo workload cụ thể và memory/listener lifecycle; không gọi unit timing là zero-lag chart. **Rollback:** mỗi tối ưu source độc lập, giữ document schema.

## D. Roadmap và thứ tự

| Bước | Output | Trạng thái |
|---|---|---|
| Installer research | Hash/inventory/source-map metadata/boundary evidence | Đã có trong phạm vi báo cáo |
| Public repository import | Source mới, báo cáo và metadata không chứa nội bộ WaveAlpha | Gói công bố được chuẩn bị; kết quả upload xác minh bằng Git HEAD/tree |
| Release 1 | Local UI → renderer → drawing gesture → durable document → reload | Chưa triển khai |
| Release 2 | Indicator panes, multi-chart/layout/favorites/mobile | Chưa triển khai |
| Release 3 | Auth/server CAS/recovery/multi-device | Chưa triển khai; không provision hạ tầng tự động |
| Các release mở rộng | Desktop/replay/alerts/DSL/broker adapters theo scope | Theo [FULL_PRODUCT_SCOPE](FULL_PRODUCT_SCOPE.md) |

**Next best action:** dựng vertical slice Release 1 bằng dữ liệu synthetic có nhãn và tests offline. Integration vào hệ thống WaveAlpha phải đọc source of truth mới của project đó và qualify riêng; việc công bố repo không cho phép Product/Production deploy.
