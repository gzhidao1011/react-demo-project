/**
 * @description Joins URL path segments properly, removing duplicate slashes using URL encoding
 * @param {...string} segments - URL path segments to join
 * @returns {string} Properly joined URL path
 * @example
 * joinUrlPath("/workspace", "/projects") => "/workspace/projects"
 * joinUrlPath("/workspace", "projects") => "/workspace/projects"
 * joinUrlPath("workspace", "projects") => "/workspace/projects"
 * joinUrlPath("/workspace/", "/projects/") => "/workspace/projects/"
 */
export const joinUrlPath = (...segments: string[]): string => {
  if (segments.length === 0) return "";

  // Filter out empty segments
  const validSegments = segments.filter((segment) => segment !== "");
  if (validSegments.length === 0) return "";

  // Process segments to normalize slashes
  const processedSegments = validSegments.map((segment, index) => {
    let processed = segment;

    // Remove leading slashes from all segments except the first
    while (processed.startsWith("/")) {
      processed = processed.substring(1);
    }

    // Remove trailing slashes from all segments except the last
    if (index < validSegments.length - 1) {
      while (processed.endsWith("/")) {
        processed = processed.substring(0, processed.length - 1);
      }
    }

    return processed;
  });

  // Join segments with single slash
  const joined = processedSegments.join("/");

  // Use URL constructor to normalize the path and handle double slashes
  try {
    // Create a dummy URL to leverage browser's URL normalization
    const dummyUrl = new URL(`http://example.com/${joined}`);
    return dummyUrl.pathname;
  } catch {
    // Fallback: manually handle double slashes by splitting and filtering
    const pathParts = joined.split("/").filter((part) => part !== "");
    return pathParts.length > 0 ? `/${pathParts.join("/")}` : "";
  }
};
