export function extractRepoName(url) {
  if (!url) return "project";

  const cleanUrl = url.replace(/\/$/, "");

  if (cleanUrl.includes("github.com/")) {
    const parts = cleanUrl.split("github.com/")[1].split("/");
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1].replace(".git", "")}`;
    }
  }

  return cleanUrl.split("/").pop().replace(".git", "") || "project";
}