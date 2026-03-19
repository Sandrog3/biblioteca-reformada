export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Standard regex for most YouTube URLs
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // Fallback for direct shorts links or other patterns
  const patterns = [
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m && m[1]) return m[1];
  }

  return null;
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  // controls=0: hide controls
  // modestbranding=1: hide youtube logo
  // rel=0: show related videos from the same channel
  // autoplay=1: start playing automatically
  // mute=1: required for autoplay in most browsers
  return `https://www.youtube.com/embed/${id}?controls=0&modestbranding=1&rel=0&autoplay=1&mute=1`;
}
