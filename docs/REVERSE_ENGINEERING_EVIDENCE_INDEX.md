# Evidence Index

Ngày: 22/10/2026, Asia/Saigon. Phân loại: **CONFIRMED_STATIC**, **INFERRED**, **UNKNOWN**. PASS test được ghi riêng, không đồng nghĩa đã chạy TradingView hoặc đã sửa WaveAlpha.

## Bằng chứng có thể tiếp tục từ repository này

| Tệp | Nội dung |
|---|---|
| [input-hashes.json](../evidence/input-hashes.json) | Tên, kích thước, SHA-256 đúng bốn file được cung cấp |
| [package-summary.json](../evidence/package-summary.json) | ASAR hash, file/JS/map counts, native sizes/integrity, parser summary |
| [linux-asar-inventory.json](../evidence/linux-asar-inventory.json) | Từng path, size, offset, hash, unpacked và kết quả integrity Linux |
| [windows-asar-inventory.json](../evidence/windows-asar-inventory.json) | Inventory tương ứng Windows |
| [macos-asar-inventory.json](../evidence/macos-asar-inventory.json) | Inventory tương ứng macOS, giữ nguyên bốn mismatch |
| [findings.json](../evidence/findings.json) | TV03–TV17: source map path/hash, source index/path/hash, dòng bắt đầu/kết thúc, mô tả; không có code |
| [module-graph.json](../evidence/module-graph.json) | Metadata parser, selected source identities, imports, boundary-call labels và relative-import edges; không có source content |
| [reference-contract-tests.txt](../evidence/reference-contract-tests.txt) | Kết quả thực thi 30 test độc lập mới |

Bundle/source map/native binary trích xuất **không nằm trong repository**. Các input gốc vẫn là những bộ cài người dùng đã tải lên. Để tái đọc code bằng chứng, cần bộ cài đúng hash và trích xuất lại ở khu nghiên cứu riêng. Repo chỉ giữ path/hash/line/spec, không phát hành lại code TradingView.

## Bằng chứng file và offset

TV01: `package.json` của cả ba ASAR; DMG `TradingView.app/Contents/Info.plist`; Electron Framework plist macOS.

TV02: ASAR `configs/config.json`, mục URLs. Corroboration trực tiếp Windows `index.js`: chuỗi `TradingViewApi` có 55 occurrences, occurrence đầu byte 874767; `saveChartToServer` ở byte 988015; `/my-charts/` occurrence đầu byte 1087920; `autoSaveInterval` occurrence đầu byte 1494729. Đây là offset UTF-8 tính trên Windows main bundle SHA-256 `4f7c4e6d470d7f33c9b68dd23afcece3f1a16d6b7b2adc2744dc8748f54e97f3`, không áp cho file khác và không bao gồm source-map contents.

TV03–17 có source-map coordinates chính xác trong `findings.json`. Ví dụ TV08: `index.js.map`, source index 904, `..\src\services\window\tab\tv-api-scripts.ts`, lines 90–97; TV07: cùng map, index 1155, persistence service lines 54–107. Dòng gắn với `sourcesContent` trong đúng map; không phải dòng của minified `index.js`.

TV18: `.map` count trong ba inventory; DMG native mismatch trong package summary. Không dùng SHA-256 tự tính để thay thế kiểm tra chữ ký vendor.

## Ranh giới với dự án WaveAlpha riêng tư

Đối chiếu với source và current truth của WaveAlpha đã được thực hiện trong khu nghiên cứu riêng. Bản Public này không chứa checkpoint SHA, source file identities, nội dung source, deployment metadata, hostname, cấu hình hoặc findings vận hành riêng tư. Bản đầy đủ được giữ riêng; không dùng repo nghiên cứu Public làm source of truth của hệ thống đang chạy.

Việc thiếu bảng source WaveAlpha trong bản công khai là chủ ý bảo vệ phạm vi dữ liệu, không có nghĩa những đối chiếu chưa công bố đã trở thành Public PASS. Không có Product/Production mutation trong nhiệm vụ đưa gói nghiên cứu lên repo.

## Công cụ, phiên bản và phương pháp

- Python 3.12.14: `hashlib`, `zipfile`, `plistlib`, ASAR/UDIF helpers tự viết.
- Node 24.19.0: thực thi REA CLI, parser và tests module mới.
- REA 6.7.0: version/help + metadata-only probe PASS; JS probe BLOCKED process-ownership.
- `@babel/parser` 8.0.4: parse TypeScript/TSX với decorators; bật JSX chỉ cho `.tsx/.jsx`.
- 7-Zip executable 26.04, lấy qua package `7zip-bin-full@26.4.1`: DMG/HFS extraction PASS. Package version và executable version khác nhau, đã ghi tách biệt.
- `dpkg-deb`, `file`, `readelf`: package metadata, CPU/native symbols. Không ghi phiên bản chưa đo của các utility này.

Các lệnh/nghiệp vụ đã thực thi:

```text
sha256sum ba bộ cài và tệp hướng dẫn
dpkg-deb -f / -c / -x tradingview_amd64.deb
Python zipfile: list/read/extract app.asar và manifest của MSIX
7zzs l / x TradingView.dmg
Python ASAR: inventory, SHA256/hash blocks, extract vào scratch riêng
rea --version
rea analyze-javascript-application --help
rea analyze-javascript-application <linux-asar> --source-path package.json --analysis-timeout-ms 45000 --json
rea analyze-javascript-application <linux-asar> --source-path preload/platform-preload.js --source-path preload/target-tvd-host-preload.js --source-path index.js --max-semantic-nodes 12000 --max-semantic-nodes-per-file 6000 --analysis-timeout-ms 45000 --json
Python JSON: source-map inventories, metadata identities và cross-platform hashes
node fallback parser: module/import graph từ selected application sourcesContent
readelf -Ws tvdbridge.node
GitHub connector: kiểm tra repo mới, visibility, initial tree và Actions
npm test (repo nghiên cứu mới)
npm run check (repo nghiên cứu mới)
```

## Thử nghiệm thất bại và cách xử lý

1. Shell clone private thiếu credential → tiếp tục nghiên cứu riêng bằng connector; không công bố nội dung repo đó.
2. Root SKILL/AGENTS không tồn tại → theo README tìm đúng operator skill, không giả thiếu policy.
3. `apt-get update` lỗi setgroups/setuid trong môi trường → không escalation; dùng archive tool từ npm cục bộ.
4. p7zip 16.02 không mở được DMG/HFS → 7-Zip 26.04 đọc thành công.
5. Import `@electron/asar` qua cây dependency REA không tìm thấy → dùng ASAR reader tự viết; kiểm tra integrity thay vì giả đã dùng thư viện đó.
6. REA JS bị chặn bởi `ps` ownership → giữ lỗi BLOCKED và dùng parser khác, không bypass ownership.
7. Babel lần đầu bật JSX cho mọi `.ts` gây 9 parse errors từ angle-bracket TypeScript → bật theo extension; lần sau 790/790 selected entries parse thành công, không sửa vendor code.
8. ASAR macOS dừng ở native mismatch đầu tiên → record-and-continue chỉ trong static reader, ghi cả bốn mismatch; không sửa input hoặc gọi integrity toàn gói PASS.
9. Luồng browser tạo repo yêu cầu đăng nhập. Owner sau đó đã tạo repo và cung cấp URL; GitHub plugin xác minh được repo hiện hữu và có quyền ghi. Bước nhập source không cần browser authentication.

Những lỗi công cụ này không được ghi thành lỗi sản phẩm WaveAlpha/TradingView. Không cần owner chạy lại các bước đã PASS.

## Công bố source

Chủ dự án cung cấp repository mới, Public, chỉ có README ban đầu. Bản chuẩn bị công bố giữ nguyên code đã kiểm thử, loại source identities và chi tiết vận hành riêng tư, dùng một commit kế thừa README ban đầu. Sau cập nhật ref phải kiểm tree/blob parity, exact HEAD và Actions run count. Không đẩy bundle Git cũ hoặc tạo CI workflow.
