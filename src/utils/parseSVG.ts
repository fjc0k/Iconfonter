export interface ParseSVGReturn {
  viewBox: string,
  paths: string,
}

export function parseSVG(svg: string): ParseSVGReturn {
  const [, viewBox, paths] = svg.trim().match(/^<svg[^>]*?viewBox=['"]([^>]*?)['"][^>]*?>(.*?)<\/svg>$/is)
  return { viewBox, paths }
}
