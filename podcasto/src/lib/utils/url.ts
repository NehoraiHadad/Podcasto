/**
 * Returns the base URL for the current environment
 * This is used for redirects in authentication flows
 */
export const getURL = () => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, always use localhost
  if (isDevelopment) {
    return 'http://localhost:3000/';
  }
  
  // In production, use the configured URL
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000';
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('localhost') ? `http://${url.replace('http://', '')}` : `https://${url.replace('https://', '')}`;
  
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`;
  
  return url;
}; 