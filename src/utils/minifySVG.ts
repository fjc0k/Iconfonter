const div = document.createElement('div')

export default function minifySVG(svg: string): string {
  div.firstChild && div.removeChild(div.firstChild)
  div.innerHTML = svg
  const svgNode = div.firstChild as SVGElement
  svgNode.removeAttribute('class')
  svgNode.removeAttribute('style')
  svgNode.removeAttribute('version')
  return div.innerHTML
}
