export default function minifySVG<T>(svg: string, extraAttrs?: { [key: string]: string }, returnNode?: T): T extends true ? HTMLElement : string {
  const div = document.createElement('div')
  div.innerHTML = svg
  const svgNode = div.firstChild as SVGElement
  svgNode.removeAttribute('class')
  svgNode.removeAttribute('style')
  svgNode.removeAttribute('version')
  if (extraAttrs) {
    Object.keys(extraAttrs).forEach(key => {
      svgNode.setAttribute(key, extraAttrs[key])
    })
  }
  return (returnNode ? div.firstChild : div.innerHTML) as any
}
