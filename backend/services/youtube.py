import asyncio
import yt_dlp

async def extract_youtube_content(url: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract_sync, url)

def _extract_sync(url: str) -> str:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'skip_download': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    parts = []
    if info.get('title'):
        parts.append(f"Title: {info['title']}")
    if info.get('description'):
        parts.append(f"Description: {info['description'][:500]}")
    if info.get('tags'):
        parts.append(f"Tags: {', '.join(info['tags'][:20])}")
    if info.get('categories'):
        parts.append(f"Categories: {', '.join(info['categories'])}")

    return '\n\n'.join(parts) if parts else f"YouTube video: {url}"
