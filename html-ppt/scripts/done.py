#!/usr/bin/env python3
"""html-ppt 批量模式：把已完成的 URL 从队列文件里原子删除。

用法：
    python3 scripts/done.py <队列文件> <url>

并发安全：用 fcntl.flock 独占锁，多个收尾进程同时删也不会互相覆盖。
找不到该 URL 时原样保留文件，打印 not-found。
"""
import sys
import fcntl

if len(sys.argv) != 3:
    print(__doc__.strip(), file=sys.stderr)
    sys.exit(2)

queue, url = sys.argv[1], sys.argv[2].strip()

try:
    with open(queue, 'r+') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        lines = f.read().splitlines(True)
        kept = [l for l in lines if l.strip() != url]
        if len(kept) != len(lines):
            f.seek(0)
            f.truncate()
            f.writelines(kept)
        fcntl.flock(f, fcntl.LOCK_UN)
    print('removed' if len(kept) != len(lines) else 'not-found', url)
except FileNotFoundError:
    print('queue-not-found', queue, file=sys.stderr)
    sys.exit(1)
