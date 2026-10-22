import json, struct, hashlib, pathlib, sys

archive = pathlib.Path(sys.argv[1]); dest = pathlib.Path(sys.argv[2]); report = pathlib.Path(sys.argv[3])
with archive.open('rb') as f:
    header = f.read(16)
    outer_size, header_size, pickle_size, json_size = struct.unpack('<IIII', header)
    assert outer_size == 4 and json_size <= header_size - 8
    root = json.loads(f.read(json_size)); base = 8 + header_size
    inventory = []
    def walk(node, prefix=''):
        for name, entry in node.get('files', {}).items():
            assert name not in ('', '.', '..') and '/' not in name and '\\' not in name
            rel = prefix + name
            if 'files' in entry: walk(entry, rel + '/'); continue
            row = {'path': rel, 'size': entry.get('size'), 'offset': entry.get('offset'), 'unpacked': entry.get('unpacked', False)}
            if 'link' in entry:
                row['link'] = entry['link']; inventory.append(row); continue
            if entry.get('unpacked'):
                data = pathlib.Path(str(archive) + '.unpacked', rel).read_bytes()
            else:
                size = int(entry['size']); off = int(entry['offset']); assert 0 <= size <= 100_000_000 and 0 <= off and base + off + size <= archive.stat().st_size
                f.seek(base + off); data = f.read(size); assert len(data) == size
            row['sha256'] = hashlib.sha256(data).hexdigest()
            integrity = entry.get('integrity')
            if integrity:
                assert integrity['algorithm'] == 'SHA256'
                row['integrity_valid'] = row['sha256'] == integrity['hash']
                blocksize = integrity['blockSize']; blocks = [hashlib.sha256(data[i:i+blocksize]).hexdigest() for i in range(0,len(data),blocksize)]
                if not data: blocks = [hashlib.sha256(b'').hexdigest()]
                row['block_integrity_valid'] = blocks == integrity.get('blocks')
                if not (row['integrity_valid'] and row['block_integrity_valid']) and '--record-integrity-mismatch' not in sys.argv:
                    raise ValueError('ASAR integrity mismatch: ' + rel)
            out = dest / rel; out.parent.mkdir(parents=True, exist_ok=True); out.write_bytes(data)
            inventory.append(row)
    walk(root)
report.write_text(json.dumps({'archive':str(archive),'header_size':header_size,'payload_base':base,'inventory':inventory},indent=2))
print(json.dumps({'archive':str(archive),'files':len(inventory),'bytes':sum(x.get('size') or 0 for x in inventory),'unpacked':sum(x['unpacked'] for x in inventory),'integrity_checked':sum('integrity_valid' in x for x in inventory),'integrity_mismatches':[x['path'] for x in inventory if x.get('integrity_valid') is False or x.get('block_integrity_valid') is False]}))
