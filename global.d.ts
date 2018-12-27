declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.less'
declare module '*.scss'
declare module '*.sass'
declare module '*.styl'

declare module 'mini-svg-data-uri' {
  function svgToMiniDataURI(svgStr: string): string

  export = svgToMiniDataURI
}
