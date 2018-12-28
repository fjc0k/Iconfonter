import svgToMiniDataURI from 'mini-svg-data-uri'
import minifySVG from './minifySVG'
import { minifyPNG } from '.'

export default function makeCSSSprite({
  icons,
  format,
  iconSize,
  quality,
  gap,
}: {
  icons: { [iconName: string]: string },
  format: 'svg' | 'png',
  iconSize: number,
  quality: number,
  gap: number,
}) {
  const iconNames = Object.keys(icons)
  const iconCount = iconNames.length
  const spriteWidth = iconSize
  const spriteHeight = (iconSize + gap) * iconCount - gap
  const isPngFormat = format === 'png'
  let canvas: HTMLCanvasElement
  let canvasCtx: CanvasRenderingContext2D
  let svgCtx: HTMLElement
  if (isPngFormat) {
    canvas = document.createElement('canvas')
    canvasCtx = canvas.getContext('2d')
    canvas.width = spriteWidth
    canvas.height = spriteHeight
  } else {
    svgCtx = document.createElement('svg')
    svgCtx.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svgCtx.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    svgCtx.setAttribute('width', `${spriteWidth}`)
    svgCtx.setAttribute('height', `${spriteHeight}`)
    svgCtx.setAttribute('viewBox', `0 0 ${spriteWidth} ${spriteHeight}`)
  }
  return Promise.all<{ name: string, y: number }>(
    iconNames.map((iconName, index) => {
      return new Promise(resolve => {
        const iconSvg = icons[iconName]
        const [, svgWidth, svgHeight]: number[] = iconSvg.match(/viewBox=["']\d+\s+\d+\s+(\d+)\s+(\d+)["']/) as any
        const y = index * (iconSize + gap) + Math.max(0, (iconSize - (svgHeight * (iconSize / svgWidth))) / 2)
        if (isPngFormat) {
          let img = document.createElement('img')
          img.onload = () => {
            canvasCtx.drawImage(img, 0, y)
            img = null
            resolve({
              name: iconName,
              y: index * (iconSize + gap),
            })
          }
          img.src = svgToMiniDataURI(iconSvg)
        } else {
          const svgNode = minifySVG(iconSvg, {
            width: `${iconSize}`,
            height: `${svgHeight * (iconSize / svgWidth)}`,
            y: `${y}`,
          }, true)
          svgCtx.append(svgNode)
          resolve({
            name: iconName,
            y: index * (iconSize + gap),
          })
        }
      })
    })
  )
    .then(icons => {
      return Promise.all([
        Promise.resolve(icons),
        new Promise(resolve => {
          if (isPngFormat) {
            const rawDataUri = canvas.toDataURL('image/png')
            minifyPNG(rawDataUri, quality)
              .then(resolve)
              .catch(() => resolve(rawDataUri))
          } else {
            resolve(svgToMiniDataURI(svgCtx.outerHTML))
          }
        }),
      ])
    })
}
