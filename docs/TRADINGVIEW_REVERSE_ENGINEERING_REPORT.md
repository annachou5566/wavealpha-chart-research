# TradingView Desktop — báo cáo phân tích tĩnh

Ngày: **22/10/2026, Asia/Saigon**. Mục tiêu: nghiên cứu bộ cài đã tải lên, xác định ranh giới mã thực sự hiện diện, đối chiếu WaveAlpha và chuẩn bị repository triển khai độc lập. Không chạy TradingView, không đăng nhập TradingView, không gọi API tài khoản của họ.

## Kết luận chính

Ba gói đều chứa ứng dụng Electron 3.4.1 và `app.asar`. Gói Windows đặc biệt có **63 source map với 3.323 source entries có nội dung**; không phải 3.323 module sản phẩm độc lập. Sau chọn source ứng dụng TypeScript/TSX và chuẩn hóa đường dẫn: **790 entries parse thành công, 455 đường dẫn khác nhau**. Nhiều entry lặp lại giữa bundle.

Mã đọc được giải thích khá rõ desktop shell: tab/cửa sổ, IPC/preload, trạng thái tài khoản, danh mục layout, lưu/khôi phục phiên, dialog lỗi và luồng lưu khi đóng. Các adapter gọi `window.TradingViewApi` trên trang chart. Chưa tìm thấy implementation đầy đủ của chart renderer, drawing engine, indicator/Pine engine hoặc backend trong inventory và nguồn đã khảo sát. Vì vậy **không thể tuyên bố đã giải mã toàn bộ TradingView** từ ba gói này.

Source map là nội dung do bên phát hành đóng gói. Đã đối chiếu một số tên API/chuỗi với bundle thực tế; chưa chứng minh mọi dòng `sourcesContent` tương đương hoàn toàn với code runtime sau tối ưu. Mọi kết luận dưới đây là kết luận tĩnh trong phạm vi được ghi.

## Đầu vào

| File | Bytes | SHA-256 |
|---|---:|---|
| TradingView.dmg | 226974323 | `cf8cd66b5bc7f3755e1d77c31e068ed7b40fce17a76df9b4086ebff04fe85e32` |
| TradingView.msix | 168047410 | `fb9ac708c7dd4e82e563a75f678b79ddba6baf6b92cda7552b375ddad50ef84e` |
| tradingview_amd64.deb | 133040714 | `ec381f4239db177e1f3d9bed151a635c4ec56b5c3780ebd1b18a63657806c868` |
| Văn bản đã dán (1)(2).txt | 19678 | `8103721f88ffeab9687a493fc193b37c6723525b1d6b71a59766e7da42727514` |

SHA-256 xác định chính xác file đã đọc, không tự chứng nhận nguồn gốc hay chữ ký nhà phát hành. Authenticode, notarization và chữ ký package: **NOT TESTED**.

## Kết quả package inspection

| Gói | Metadata phiên bản | CPU | ASAR bytes | Files trong ASAR | JS | Source maps |
|---|---|---|---:|---:|---:|---:|
| Linux DEB | `3.4.1-1`, package `tradingview` | AMD64 | 21104210 | 171 | 61 | 0 |
| Windows MSIX | `3.4.1.8194`, app `3.4.1` | x64 | 38119804 | 237 | 63 | 63 |
| macOS DMG | `3.4.1`, bundle `3.4.1.8194` | Universal x86_64 + arm64 | 21104502 | 172 | 61 | 0 |

macOS yêu cầu tối thiểu 12.0 theo plist. Electron Framework của **gói macOS** khai báo `41.7.1`; chưa độc lập xác minh phiên bản runtime của hai gói còn lại, không suy rộng tự động.

DEB là Debian ar package với payload gzip. MSIX là ZIP có manifest Windows FullTrustApplication. DMG có trailer UDIF `koly`, partition HFS+, các run ZLIB/Copy/Zero; 7-Zip 26.04 đọc và trích xuất thành công. `file` ban đầu nhận DMG là zlib chỉ là nhận diện sơ bộ, không có nghĩa file sai định dạng.

Có 166 đường dẫn ASAR chung giữa ba nền tảng; 88 file giống SHA-256 trên cả ba. Linux và macOS giống byte 60/61 file JS. Các file JS giữa Windows và hai gói khác không giống byte tuyệt đối; source-map comments/build output và các khác biệt nền tảng cần phân biệt trước khi so logic.

## Integrity và native

Linux: 171/171 file có SHA-256 và block hash khai báo khớp. Windows: 237/237 khớp. macOS: 168 file khớp; **4 native unpacked files không khớp ASAR integrity khai báo**: `classic_level.node`, `notificationstate.node`, `keytar.node`, `native/tvdbridge.node`. Toàn bộ native macOS khảo sát là universal hoặc thành phần native của bundle; metadata kích thước khai báo và kích thước thực tế được giữ trong evidence. Quá trình ghép/ký universal có thể giải thích khác biệt nhưng **nguyên nhân UNKNOWN**. Không kết luận malware, cũng không tuyên bố integrity toàn bộ macOS PASS. Không sửa file gốc hoặc metadata.

`classic-level` được import ở session-storage backend; `keytar` xuất hiện trong dependency/code. `tvdbridge.node` tồn tại ở cả ba nền tảng. ELF Linux của bridge bị stripped và có imports `node_module_register`, `XOpenDisplay`, `XQueryPointer`. Điều này chỉ chứng minh liên kết native/desktop; chưa khôi phục đầy đủ logic native hay gán vai trò chart renderer cho nó.

## REA: cài thật, giới hạn thật

Đã đọc README, installation, CLI và JavaScript application workflows tại [repo chính thức](https://github.com/morluto/rea). Đã cài cục bộ `rea-agents@6.7.0` từ npm với `--ignore-scripts --omit=optional`; không thay cấu hình agent, không cài Hopper/Ghidra, không mở MCP/public endpoint.

Node 24.19.0 đáp ứng engines của REA 6.7.0. `rea --version` trả 6.7.0; `analyze-javascript-application --help` hoạt động. Probe chọn `package.json` trả Evidence inventory/metadata thành công. Probe chọn JavaScript bị **BLOCKED** trước khi helper phân tích nguồn khởi chạy: `capability_unavailable`, process-ownership, `ps` trả `fatal library error, lookup self`. Đây là lỗi môi trường công cụ, không phải lỗi TradingView.

Không giả lập `ps` hoặc bỏ kiểm tra ownership. Tiếp tục bằng công cụ ASAR tự viết, Python `zipfile`/`plistlib`, 7-Zip, Babel parser và đọc source map. **Module graph và phát hiện nguồn trong báo cáo là kết quả fallback tĩnh, không phải kết quả phân tích JavaScript thành công của REA.**

| Khả năng | Trạng thái |
|---|---|
| REA CLI/version/help trong Work | PASS |
| REA metadata-only ASAR probe | PASS |
| REA supervised JavaScript parsing | BLOCKED bởi `ps` của Work |
| Babel parse source ứng dụng đã chọn | PASS, 790 entries / 455 paths, 0 lỗi sau sửa cấu hình parser |
| Native decompiler Ghidra/Hopper/IDA | NOT INSTALLED / NOT TESTED |
| MCP registration cho phiên ChatGPT này | NOT CONFIGURED |
| REA trên Termux ARM64 | NOT TESTED; không yêu cầu người dùng chạy thay |

REA cần Node 22.19+/24.11+/26+ theo tài liệu được đọc; native providers có điều kiện host/CPU riêng. Có script build Termux trong repo REA nhưng điều đó không chứng minh mọi provider chạy trên Android. Không khẳng định x86-only cho toàn bộ REA.

## Phạm vi hoàn thành và còn thiếu

Hoàn thành: đọc byte ba package, hash, metadata, inventory, trích xuất ASAR, kiểm tra integrity, phân tích source-map metadata, module/import graph, các boundary desktop/web, đối chiếu riêng với WaveAlpha và 30 test cho module mới độc lập.

Chưa thực hiện: chạy ứng dụng TradingView, network capture, thao tác UI chart TradingView hiện hành, giải mã thuật toán renderer/drawing/Pine phía web, phân tích backend, benchmark thực tế, Electron security audit đầy đủ và kiểm thử mobile. Không tìm cách vượt đăng nhập hoặc lấy nội dung server không được cung cấp.

Repo riêng đã có đặc tả, bằng chứng và nền source mới; phần mềm tương đương toàn bộ TradingView là lộ trình nhiều giai đoạn trong [FULL_PRODUCT_SCOPE](FULL_PRODUCT_SCOPE.md), chưa hoàn thành. Source WaveAlpha và Production không thay đổi.

## Phạm vi bản công khai

Bản đầy đủ có đối chiếu và checkpoint WaveAlpha riêng tư; các thông tin vận hành đó được giữ ngoài repository Public này. Danh mục installer/source-map TradingView và code độc lập vẫn được công bố. Source/backend WaveAlpha không được tái phát hành và không có thay đổi Product/Production trong bước xuất bản.
