#!/usr/bin/env python3
"""
Serena Hub CLI — Codex 에이전트용 Serena HTTP MCP 클라이언트

Usage:
  python3 scripts/serena-hub.py read_memory <file>
  python3 scripts/serena-hub.py write_memory <file> <content>
  python3 scripts/serena-hub.py find_symbol <name> [file]
  python3 scripts/serena-hub.py search <pattern>
  python3 scripts/serena-hub.py list_memories

Serena HTTP server must be running on SERENA_HUB_URL (default: http://localhost:8765)
"""

import json
import sys
import os
import urllib.request
import urllib.error

SERENA_URL = os.environ.get("SERENA_HUB_URL", "http://localhost:8765") + "/mcp"
TIMEOUT = 30


def _request(session_id: str, method: str, params: dict, req_id: int = 1) -> dict:
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": req_id,
        "method": method,
        "params": params,
    }).encode()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["mcp-session-id"] = session_id

    req = urllib.request.Request(SERENA_URL, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode()
            # SSE 형식 처리: "data: {...}" 라인에서 JSON 추출
            for line in raw.splitlines():
                if line.startswith("data:"):
                    return json.loads(line[5:].strip())
            return json.loads(raw)
    except urllib.error.URLError as e:
        return {"error": f"Connection failed: {e}"}


def _init_session() -> str:
    result = _request("", "initialize", {
        "protocolVersion": "2025-03-26",
        "capabilities": {},
        "clientInfo": {"name": "codex-agent", "version": "1.0"},
    })
    if "error" in result:
        print(f"ERROR: Serena HTTP 서버에 연결할 수 없습니다 ({SERENA_URL})", file=sys.stderr)
        print("launch.sh가 PHASE 1에서 serena-hub를 시작했는지 확인하세요.", file=sys.stderr)
        sys.exit(1)
    # session ID는 응답 헤더에서 오지만 urllib으로 캡처하기 어려움
    # 대신 두 번째 요청을 통해 세션 확립
    return result.get("_session_id", "")


def _get_session_id() -> str:
    """
    Initialize 요청을 보내고 응답 헤더에서 session ID를 추출.
    urllib으로는 헤더 직접 접근이 어려우므로 raw HTTP로 처리.
    """
    import http.client
    host = SERENA_URL.replace("http://", "").split("/")[0]
    path = "/" + "/".join(SERENA_URL.replace("http://", "").split("/")[1:])
    hostname, _, port = host.partition(":")
    conn = http.client.HTTPConnection(hostname, int(port) if port else 8765, timeout=TIMEOUT)
    payload = json.dumps({
        "jsonrpc": "2.0", "id": 0, "method": "initialize",
        "params": {
            "protocolVersion": "2025-03-26", "capabilities": {},
            "clientInfo": {"name": "codex-agent", "version": "1.0"},
        },
    })
    conn.request("POST", path, body=payload, headers={
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    })
    resp = conn.getresponse()
    session_id = resp.getheader("mcp-session-id", "")
    resp.read()  # consume body
    conn.close()
    return session_id


def call_tool(tool_name: str, arguments: dict) -> str:
    session_id = _get_session_id()
    result = _request(session_id, "tools/call", {
        "name": tool_name,
        "arguments": arguments,
    }, req_id=2)
    if "error" in result:
        return f"ERROR: {result['error']}"
    content = result.get("result", {}).get("content", [])
    if content and isinstance(content, list):
        return content[0].get("text", str(result))
    structured = result.get("result", {}).get("structuredContent", {})
    if structured:
        return structured.get("result", str(structured))
    return str(result.get("result", result))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "read_memory":
        if len(sys.argv) < 3:
            print("Usage: serena-hub.py read_memory <file>", file=sys.stderr)
            sys.exit(1)
        print(call_tool("read_memory", {"memory_file_name": sys.argv[2]}))

    elif cmd == "write_memory":
        if len(sys.argv) < 4:
            print("Usage: serena-hub.py write_memory <file> <content>", file=sys.stderr)
            sys.exit(1)
        content = sys.argv[3]
        print(call_tool("write_memory", {"memory_file_name": sys.argv[2], "content": content}))

    elif cmd == "find_symbol":
        if len(sys.argv) < 3:
            print("Usage: serena-hub.py find_symbol <name> [file]", file=sys.stderr)
            sys.exit(1)
        args = {"name_path_pattern": sys.argv[2], "depth": 1}
        if len(sys.argv) >= 4:
            args["relative_path"] = sys.argv[3]
        print(call_tool("find_symbol", args))

    elif cmd == "search":
        if len(sys.argv) < 3:
            print("Usage: serena-hub.py search <pattern>", file=sys.stderr)
            sys.exit(1)
        print(call_tool("search_for_pattern", {
            "substring_pattern": sys.argv[2],
            "restrict_search_to_code_files": True,
        }))

    elif cmd == "list_memories":
        print(call_tool("list_memories", {}))

    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
