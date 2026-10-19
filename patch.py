import os

api_path = "api.py"

if not os.path.exists(api_path):
    print("Error: api.py not found!")
    exit(1)

with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add proxy endpoint if missing
proxy_code = '''
@app.get("/api/proxy/video")
async def proxy_video(
    url: str = Query(...), 
    referer: str = Query("https://123moviesfree.club/")
):
    """Proxies video streams through the backend to bypass CDN CORS and Referer blocks."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer,
        "Origin": referer.rstrip("/")
    }

    async def stream_generator():
        async with httpx.AsyncClient(follow_redirects=True) as client:
            async with client.stream("GET", url, headers=headers) as response:
                async for chunk in response.aiter_bytes(chunk_size=1024 * 64):
                    yield chunk

    return StreamingResponse(stream_generator(), media_type="video/mp4")
'''

if "/api/proxy/video" not in content:
    if 'if __name__ == "__main__":' in content:
        content = content.replace('if __name__ == "__main__":', proxy_code + '\n\nif __name__ == "__main__":')
    else:
        content += "\n" + proxy_code
    print("Added proxy endpoint to api.py")
else:
    print("Proxy endpoint already exists.")

# 2. Update the play function in the HTML dashboard template
old_play_js = '''        function play(encoded) {
            const stream = JSON.parse(decodeURIComponent(encoded));
            const player = document.getElementById("player");
            const container = document.getElementById("playerContainer");
            container.style.display = "flex";
            document.getElementById("playerStatus").textContent = `Playing: ${stream.quality} ${stream.format}`;
            player.src = stream.url;
            player.play().catch(() => {});
        }'''

new_play_js = '''        function play(encoded) {
            const stream = JSON.parse(decodeURIComponent(encoded));
            const player = document.getElementById("player");
            const container = document.getElementById("playerContainer");
            container.style.display = "flex";
            document.getElementById("playerStatus").textContent = `Playing: ${stream.quality} ${stream.format}`;
            
            const referer = stream.headers?.Referer || "https://123moviesfree.club/";
            const proxyUrl = `/api/proxy/video?url=${encodeURIComponent(stream.url)}&referer=${encodeURIComponent(referer)}`;
            
            player.src = proxyUrl;
            player.play().catch(() => {});
        }'''

if old_play_js in content:
    content = content.replace(old_play_js, new_play_js)
    print("Updated play() function successfully!")
else:
    print("Warning: Could not exact-match play() function. Please check indentation.")

with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully!")