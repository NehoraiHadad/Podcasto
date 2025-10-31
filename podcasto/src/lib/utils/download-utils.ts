/**
 * Download utilities for triggering file downloads in the browser
 */

/**
 * Downloads a file from a URL using an anchor element
 * @param url - The URL of the file to download
 * @param filename - The desired filename for the downloaded file
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a filename for an episode audio file
 * @param podcastTitle - The podcast title
 * @param episodeTitle - The episode title
 * @param extension - File extension (default: 'mp3')
 * @returns A sanitized filename
 */
export function getEpisodeFilename(
  podcastTitle: string,
  episodeTitle: string,
  extension: string = 'mp3'
): string {
  // Sanitize titles by removing invalid filename characters
  const sanitize = (str: string) => str
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const sanitizedPodcast = sanitize(podcastTitle);
  const sanitizedEpisode = sanitize(episodeTitle);

  return `${sanitizedPodcast} - ${sanitizedEpisode}.${extension}`;
}

/**
 * Checks if the browser supports the download attribute
 * @returns true if download attribute is supported
 */
export function isDownloadSupported(): boolean {
  const a = document.createElement('a');
  return 'download' in a;
}
