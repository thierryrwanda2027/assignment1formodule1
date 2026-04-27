/**
 * Injects Cloudinary transformation parameters into a URL
 * Example: w_300,h_300,c_fill,f_auto,q_auto
 */
export function getOptimizedUrl(url: string, width: number, height: number): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  
  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;
  
  const transformation = `w_${width},h_${height},c_fill,f_auto,q_auto/`;
  return `${parts[0]}/upload/${transformation}${parts[1]}`;
}
