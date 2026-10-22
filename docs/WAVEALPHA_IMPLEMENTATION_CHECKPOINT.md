# Checkpoint công khai — nghiên cứu chart và source nền

Ngày: **22/10/2026, Asia/Saigon**. Repository: https://github.com/annachou5566/wavealpha-chart-research. Visibility được kiểm tra: **Public**. Owner đã tạo repository và gửi URL; GitHub plugin có quyền ghi. Không cần browser login cho việc nhập source vào repo hiện hữu.

## Mục tiêu đã chốt

Xây dựng phần mềm chart độc lập, hướng tới phạm vi chức năng tương đương TradingView trong repository riêng. Phát triển tăng dần theo [FULL_PRODUCT_SCOPE](FULL_PRODUCT_SCOPE.md), không tuyên bố đã khôi phục toàn bộ chart core/backend từ installer. Chủ dự án dùng ChatGPT Work và Android/Termux, không có PC.

## Phạm vi công bố

Bản đầy đủ trước đó có thông tin đối chiếu/checkpoint của dự án WaveAlpha riêng tư. Bản Public này chỉ giữ code mới tự viết, installer metadata/bằng chứng TradingView, đặc tả hành vi chung và roadmap. Không công bố nội dung source, blob identities, ref/checkpoint SHA, hostname, resource/deployment IDs hoặc trạng thái vận hành riêng tư của WaveAlpha.

Không đưa lịch sử Git cục bộ của gói đầy đủ lên remote. Commit mới kế thừa README ban đầu của repository này; chỉ đưa các file đã lọc lên bằng tree/commit/ref qua GitHub plugin. Repo không có CI workflows, không deploy và không thay đổi visibility.

## Trạng thái nghiên cứu

| Phase | Trạng thái và phạm vi |
|---|---|
| Package inspection | Đã đọc byte/hash/metadata/ASAR cả ba installer |
| Integrity | Linux/Windows hashes khớp khai báo; macOS có 4 native-unpacked mismatches, nguyên nhân UNKNOWN |
| REA | CLI/version/help/metadata probe PASS; supervised JS BLOCKED bởi ps của môi trường |
| Static fallback | Babel parse 790 selected application source entries, 455 distinct paths; graph không chứa source content |
| Chart/Pine/backend reconstruction | UNKNOWN/chưa khôi phục; installer cho thấy desktop adapters và server boundaries |
| UX khảo sát | Desktop/new-tab/modal source; chart web/mobile live NOT TESTED |
| WaveAlpha integration | Không thực hiện; checkpoint/source of truth của hệ thống đó giữ riêng |
| Code reference | 5 module mới, 30/30 unit/contract tests PASS |
| Browser/mobile/hosted/performance/security | NOT TESTED cho code mới |

## Các module có thật

- `ActionGate`: guest không mutation, một popup cho concurrent clicks, không auto-replay sau login, storage HOLD và owner/context fence.
- `DrawingDocument`: validate document, anchors/ID/schema/owner, upsert/remove, last-item empty document, undo/redo, immutable snapshots và serialize/parse.
- `SaveCoordinator`: matching op/revision ACK, same-operation retry, single-flight/reentrancy, drain edit in-flight, stale account/disconnect completion và 409 hold.
- `geometry`: affine time/price transforms, segment distance và screen-distance OHLC snap.
- `indicators`: SMA, EMA, Wilder RSI với warmup và invalid-input policy rõ ràng.

Đây chưa phải ứng dụng hoàn chỉnh. Không có UI, renderer, IndexedDB/outbox, server CAS, auth provider, live feed hoặc native desktop shell. SaveCoordinator là client contract; ActionGate không thay thế server authorization. Không có dữ liệu tài khoản/market data thật trong tests.

Dirty/pending memory phải được escrow trước `connect()` đổi account/reconcile. Hiện chưa có durable recovery; tests stale ACK không chứng minh không mất state sau crash. Schema reference không tự tương thích dữ liệu của hệ thống khác.

## Công bố và verification

Remote ban đầu chỉ có README và Actions run count 0. Source của năm module và tests được giữ nguyên so với nền 30/30 đã PASS; thay đổi đợt công bố chỉ là lọc metadata/tài liệu nội bộ và cập nhật hướng dẫn Public. Chạy delivery check cho links, JSON, vendor-payload exclusion và private-identifier exclusion trước khi nhập source.

Sau branch ref update, kiểm exact HEAD, recursive tree/blob parity với source local, không có workflows và all-trigger Actions count. Không coi việc tạo tree/commit object là branch đã được cập nhật; trạng thái công bố chỉ PASS sau postcheck ref/tree.

## Kinh nghiệm để không lặp lại

Plugin GitHub đã kết nối và đọc/ghi repo hiện hữu được. Thiếu thao tác tạo repo mới không có nghĩa tài khoản chưa kết nối; browser authentication là phiên khác. Dùng connector cho thao tác nó hỗ trợ. Khi owner gửi repo mới, kiểm visibility trước khi đưa gói có tài liệu riêng tư lên. Không đẩy lịch sử cũ chứa tài liệu đã loại bỏ.

## Tiếp tục từ đây

READ FIRST: `AGENTS.md`, `README.md`, tài liệu này và [FULL_PRODUCT_SCOPE](FULL_PRODUCT_SCOPE.md).

1. Nếu postcheck publication chưa được ghi nhận bên ngoài, read-only exact ref/tree/Actions trước khi kết luận. Không blind-retry write.
2. Làm Release 1 end-to-end: synthetic data có nhãn → Canvas renderer → viewport/crosshair → drawing gesture → command/history → IndexedDB journal → reload phục hồi; guest catalog có action gate.
3. Chỉ sau local/browser/mobile/recovery qualification mới mở cloud/auth/desktop scope. Hệ thống WaveAlpha đang hoạt động có quy định/source of truth riêng và không được thay đổi từ nhiệm vụ xuất bản này.

STATUS: installer/static research và core contracts 30/30 PASS trong phạm vi; source Public được chuẩn bị để công bố; toàn phần mềm chưa hoàn thành.

REMAINING RISK: chart/Pine/backend UNKNOWN; macOS integrity mismatch; chưa có UI/durable recovery/server/browser qualification.

NEXT BEST ACTION: verify commit/ref/tree của gói công bố, sau đó vertical slice Release 1 độc lập; không deploy Production.
