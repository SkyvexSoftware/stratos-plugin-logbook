const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/positron";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

export function getMapStyle(): string {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? DARK_STYLE : LIGHT_STYLE;
}
