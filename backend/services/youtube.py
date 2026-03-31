import httpx
import re

def extract_video_id(url: str) -> str | None:
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def extract_youtube_content(url: str) -> str:
    video_id = extract_video_id(url)
    if not video_id:
        return f"YouTube video: {url}"

    parts = []

    # Get title and channel via oEmbed
    async with httpx.AsyncClient() as client:
        try:
            oembed = await client.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
                timeout=10,
            )
            if oembed.status_code == 200:
                data = oembed.json()
                if data.get("title"):
                    parts.append(f"Title: {data['title']}")
                if data.get("author_name"):
                    parts.append(f"Channel: {data['author_name']}")
        except Exception:
            pass

    # Get transcript
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
        transcript_text = ' '.join([entry['text'] for entry in transcript_list])
        if transcript_text:
            parts.append(f"Transcript:\n{transcript_text[:3000]}")
    except Exception:
        pass

    if not parts:
        parts.append(f"YouTube video ID: {video_id}")

    return '\n\n'.join(parts)
