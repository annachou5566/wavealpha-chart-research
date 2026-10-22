# Feature Gap Analysis — bản công khai

Ngày: 22/10/2026. Bản Public so sánh bằng chứng TradingView Desktop với **phạm vi code độc lập trong repository nghiên cứu**. Những đối chiếu cụ thể với source/current truth vận hành WaveAlpha được giữ trong gói riêng, không xuất bản vào repo Public. Không dùng bảng này để suy ra tính năng đang chạy của WaveAlpha.

| Feature | TradingView evidence | WaveAlpha hiện tại | Gap | Đề xuất | Priority | Risk |
|---|---|---|---|---|---|---|
| Guest thấy tools, click mới login | TV13 xác minh modal layout/new-tab; chưa tái quan sát chart toolbar | Trạng thái source riêng tư không công bố; repo nghiên cứu có ActionGate reference | Chưa có catalog/toolbar/login UI trong repo này | Data-only catalog và action gate; storage chỉ mở sau owner admission | P1 | Bypass auth/storage nếu trộn quyền nhìn với quyền dùng |
| Indicator action gate | Chart indicator source UNKNOWN | ActionGate hỗ trợ feature indicator; chưa có indicator UI | Chưa kiểm kê UI/shortcut/settings entry points | Một gate cho tất cả mutation, server vẫn phân quyền | P2 | Bỏ sót đường vào |
| Autosave và ACK | TV08–10 có save callback, timeout, close flow; cadence drawing UNKNOWN | SaveCoordinator chỉ là contract client trong repo mới | Chưa có durable outbox hoặc backend | Local recovery trước, matching ACK mới báo saved | P0 | Mất thay đổi nếu nhầm ACK hoặc mất trang |
| Xóa drawing cuối | Drawing backend UNKNOWN | DrawingDocument giữ document với mảng rỗng | Chưa có reload test qua storage thật | Xóa cuối vẫn gửi snapshot hợp lệ; test restore empty document | P0 | Drawing bị khôi phục nhầm |
| Conflict nhiều tab | Backend merge/CAS policy UNKNOWN | SaveCoordinator giữ 409 ở conflict | Chưa có server idempotency, multi-tab/storage transaction | Một writer, same operation khi retry, reconciliation có bảo toàn local | P0 | Lost update, duplicate writer |
| Account lifecycle | TV07, TV15 có persistence và session storage | Gate và coordinator kiểm owner/context/epoch trong test synthetic | Chưa có provider hay recovery escrow thật | Test A→B khi request đang bay, không áp ACK cũ | P0 | Rò dữ liệu giữa owner hoặc bỏ mất dirty state |
| Chart rendering | Chart core Canvas/SVG/WebGL UNKNOWN | Chỉ có geometry helper | Chưa có renderer, viewport UI, crosshair | Canvas vertical slice trước khi mở rộng | P1 | Sai tọa độ, frame scheduling |
| Drawing tools và history | Core anchors/hit-test/undo UNKNOWN | Document 5 type labels; undo/redo snapshots | Chưa có gesture/selection/renderer | Một gesture một command, pixel snapping, world anchors | P1 | Undo storm và sai target |
| Indicators math | Indicator/Pine implementation UNKNOWN | SMA/EMA/RSI batch reference | Chưa có registry, panes, incremental correction | Numerical oracle rồi append/update/correction contracts | P2 | Sai seed/warmup, biến missing thành 0 |
| Multi-chart/workspace | TV06, TV11–12 có layout adapter và website services | Chưa có layout/workspace UI | Chưa có transaction layout hoặc linked charts | Context identity trước UI và persistence | P2 | Lưu nhầm cell/layout |
| Desktop shell | TV03–06 xác minh Electron/IPC/preload boundaries | Chưa có Electron shell trong repo mới | Chưa có packaging/update/native integration | Làm sau web core, narrow bridge và disposal | P3 | Mở rộng trust boundary |
| Mobile/performance | Không có benchmark chart từ bộ cài | Core reference chỉ có unit tests | Chưa có browser/mobile/performance evidence | Đo cùng dataset/device; không tự nhận zero lag | P1 | Tối ưu theo suy đoán |

Các đề xuất là kiến trúc độc lập, không phải khẳng định TradingView dùng CAS, CRDT, IndexedDB hay một render scheduler cụ thể. Roadmap đầy đủ ở [FULL_PRODUCT_SCOPE](FULL_PRODUCT_SCOPE.md). Không sửa hoặc deploy dự án WaveAlpha đang hoạt động trong bước công bố này.
