# Mục tiêu phần mềm chart đầy đủ trong repository riêng

Chỉ thị owner bổ sung ngày 22/10/2026: sau nghiên cứu, viết phần mềm tương đương chức năng TradingView để tiếp tục nghiên cứu lâu dài trong repo riêng.

Repository do owner tạo: `annachou5566/wavealpha-chart-research`; visibility hiện được xác minh là Public. Bản công bố loại thông tin nội bộ của dự án WaveAlpha. Đây là mục tiêu xây dựng sản phẩm độc lập. Không gắn nhãn mã mới là source TradingView hoặc coi những thành phần server chưa có là đã khôi phục.

## Phạm vi và độ hoàn thành

| Hệ thống | Phạm vi cần xây dựng | Hiện có |
|---|---|---|
| Market data | Symbol identity, OHLCV, sessions/timezones, corrections, reconnect, backfill, data provenance, gap/missing semantics | Chưa triển khai; chưa chọn provider hay API license |
| Chart rendering | Nến/bar/line/area, axes linear/log/percent, viewport, price/time scales, crosshair, zoom/pan, DPI, layers, export, resize | Chỉ có helper geometry; chưa có renderer/UI |
| Drawing | Lines/rays/channels, Fib families, rectangles/shapes, text, measure, positions, anchors/snap, select/move/resize, lock/hide/group/layers/templates | Document 5 type labels và anchors; chưa có gesture engine hoặc renderer các tool |
| Command/history | Gesture transactions, undo/redo, selection history policy, clipboard, restore fidelity | Undo/redo document snapshots ban đầu; chưa có clipboard/gesture integration |
| Indicators | Registry, settings, overlays/panes, incremental update, dependencies, numerical testing, alerts bindings | SMA/EMA/RSI batch reference; chưa có registry/UI/runtime integration |
| Script engine | Ngôn ngữ/DSL độc lập, compiler/interpreter, security/resource limits, editor, runtime validation | Chưa có; không tuyên bố hỗ trợ Pine Script hoặc tương thích proprietary engine |
| Layout/workspace | Single/multi-chart, tab/window groups, favorites/templates, layout switch, symbol/time/crosshair links | Chưa có UI/layout engine |
| Persistence | Local durable store, journal/outbox, cloud CAS/idempotency, conflicts, recovery, schema versioning, device sync | Memory document + client save contract; chưa có durable store hoặc server |
| Authentication | Guest discovery, login invitation, ordinary user auth, session lifecycle, server authorization, account fences | UI action-gate reference; chưa có provider hoặc login UI |
| UI/UX | Search symbols/tools/indicators, contextual menus, floating toolbars, dialogs, touch geometry, focus/keyboard/accessibility, loading/error states | Chưa có UI |
| Watchlists | Lists/sections/favorites, quotes, sorting, import/export, synchronization | Chưa có |
| Alerts | Condition engine, schedules, durable evaluation, deduplication, notification delivery, user limits | Chưa có; cần backend/scheduler riêng được duyệt |
| Replay/backtesting | Historical playback, deterministic clock, execution assumptions, strategy metrics | Chưa có; dữ liệu và assumptions phải công khai |
| Trading integration | Paper trading, order state, positions/PnL, risk controls, broker connectors | Chưa có; live brokerage là scope riêng, không tự đặt lệnh |
| Desktop shell | Electron boundary isolation, tabs/windows, protocols, native integration, crash/session recovery, packaging/update | Có research spec, chưa có shell code |
| Mobile/tablet | Touch, pointer capture, gestures, responsive panels, keyboard handling, lifecycle/recovery | Chưa có browser/native implementation |
| Server platform | Data gateway, accounts, document service, alert workers, quotas, observability, backups | Chưa có; không thể lấy từ installer |
| Verification | Unit/property tests, integration, real browser/mobile, recovery, performance/memory, security, portability | 30 unit/contract tests cho 5 module ban đầu |

Không coi bảng này là inventory chính thức toàn bộ tính năng hiện hành của TradingView. Đây là **phạm vi sản phẩm mong muốn**, cần được mở rộng bằng quan sát hợp pháp và yêu cầu thực tế; từng release phải có acceptance criteria.

## Lộ trình theo lát cắt chạy được

**Release 0 — nghiên cứu và contracts:** đang có trong repository này. Khôi phục bằng chứng, làm rõ unknown, lưu roadmap và test nền. Chưa có chương trình chart hoàn chỉnh.

**Release 1 — chart/drawing tối thiểu nhưng end-to-end:** một app local, dataset synthetic ghi rõ; Canvas renderer; viewport/crosshair; trendline/hline/rectangle/Fib; select/drag/undo; IndexedDB transaction journal; reload phục hồi; export/import JSON; toàn bộ toolbar hiện cho guest nhưng mutation bị gate. Chế độ local nghiên cứu phải được ghi rõ, không giả là đăng nhập cloud thành công.

**Release 2 — indicator/multi-chart:** typed registry, SMA/EMA/RSI tới các nhóm chỉ báo thêm dần, panes/resize, workspace layouts và link modes, settings/favorites, keyboard/mobile. Numerical oracle và correction tests trước khi tăng danh mục.

**Release 3 — cloud có recovery:** auth adapter thật + server owner authorization + document CAS/idempotency; outbox, offline/resume, 409 reconciliation, owner/device isolation; datastore/Free headroom phải được duyệt trước khi provision. Không dùng backend TradingView.

**Release 4 — công cụ nâng cao và hiệu năng:** mở rộng drawing catalogue theo spec, text/shapes/position tools, templates, history large datasets, profiling/memory, high-DPI/mobile và accessibility. Không gắn mốc “zero lag” khi chưa có phép đo và ngân sách workload.

**Release 5 — desktop, replay và alerts:** shell độc lập, version/update strategy, deterministic replay, paper trading, alerts scheduling/delivery. Mỗi hệ thống có một owner; không tự tạo hạ tầng trả phí hoặc sử dụng Production WaveAlpha làm test.

**Release 6 — hệ sinh thái mở rộng:** DSL/editor, backtesting, approved broker adapters, collaboration/publishing và các nhóm tính năng sau khi định rõ contract. Không có thời hạn hoặc tuyên bố parity toàn bộ trước khi đo được coverage.

## Điều kiện gọi một release hoàn thành

Source có thể build/run từ hướng dẫn; không hidden dependency; test exact commit; evidence phân biệt mocked/local/browser/hosted; không mất document sau lifecycle đã cam kết; unknown/unsupported được hiển thị rõ; có migration/rollback nếu đổi schema; không chứa vendor source/assets hoặc secrets. Phiên bản 0.1.0 hiện chỉ đạt phần contracts/source, chưa đạt Release 1.
