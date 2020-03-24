import svgToMiniDataURI from 'mini-svg-data-uri'
import { ii } from 'vtils'
import { minifyPNG } from './minifyPNG'
import { minifySVG } from './minifySVG'

export interface MakeCSSSpritePayload {
  icons: { [iconName: string]: string },
  format: 'svg' | 'png',
  iconSize: number,
  quality: number,
  gap: number,
}

export interface MakeCSSSpritePosition {
  name: string,
  y: number,
}

export interface MakeCSSSpriteReturn {
  positions: MakeCSSSpritePosition[],
  dataUri: string,
}

export async function makeCSSSprite(payload: MakeCSSSpritePayload): Promise<MakeCSSSpriteReturn> {
  const iconNames = Object.keys(payload.icons)
  const iconCount = iconNames.length
  const spriteWidth = payload.iconSize
  const spriteHeight = (payload.iconSize + payload.gap) * iconCount - payload.gap
  const isPngFormat = payload.format === 'png'
  let canvas: HTMLCanvasElement
  let canvasCtx: CanvasRenderingContext2D
  let svgCtx: HTMLElement
  if (isPngFormat) {
    canvas = document.createElement('canvas')
    canvasCtx = canvas.getContext('2d')
    canvas.width = spriteWidth
    canvas.height = spriteHeight
  }
  else {
    svgCtx = document.createElement('svg')
    svgCtx.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svgCtx.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    svgCtx.setAttribute('width', `${spriteWidth}`)
    svgCtx.setAttribute('height', `${spriteHeight}`)
    svgCtx.setAttribute('viewBox', `0 0 ${spriteWidth} ${spriteHeight}`)
  }
  const positions = await Promise.all<MakeCSSSpritePosition>(
    iconNames.map((iconName, index) => {
      return new Promise(resolve => {
        const iconSvg = payload.icons[iconName]
        const [, svgWidth, svgHeight]: number[] = iconSvg.match(/viewBox=["']\d+\s+\d+\s+(\d+)\s+(\d+)["']/) as any
        const y = index * (payload.iconSize + payload.gap) + Math.max(0, (payload.iconSize - (svgHeight * (payload.iconSize / svgWidth))) / 2)
        if (isPngFormat) {
          let img = document.createElement('img')
          img.onload = () => {
            canvasCtx.drawImage(img, 0, y)
            img = null
            resolve({
              name: iconName,
              y: index * (payload.iconSize + payload.gap),
            })
          }
          img.src = svgToMiniDataURI(iconSvg)
        }
        else {
          const svgNode = minifySVG(iconSvg, {
            width: `${payload.iconSize}`,
            height: `${svgHeight * (payload.iconSize / svgWidth)}`,
            y: `${y}`,
          }, true)
          svgCtx.append(svgNode)
          resolve({
            name: iconName,
            y: index * (payload.iconSize + payload.gap),
          })
        }
      })
    }),
  )
  const dataUri = isPngFormat
    ? await ii(async () => {
      const rawDataUri = canvas.toDataURL('image/png')
      try {
        return minifyPNG(rawDataUri, payload.quality)
      }
      catch (err) {
        return rawDataUri
      }
    })
    : svgToMiniDataURI(svgCtx.outerHTML)
  return { positions, dataUri }
}
