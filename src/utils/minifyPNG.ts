function dataURLtoUint8(dataurl: string) {
  const arr = dataurl.split(',')
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return u8arr
}

export default function minifyPNG(dataurl: string, quality: number): Promise<string> {
  return new Promise(resolve => {
    const result = (window as any).pngquant(dataURLtoUint8(dataurl), {
      quality: `${Math.max(0, quality - 20)}-${Math.min(100, quality + 20)}`,
      speed: '1',
    }, () => {})
    const fh = new FileReader()
    fh.onload = e => {
      resolve((e.target as any).result)
    }
    fh.readAsDataURL(new Blob([result.data]))
  })
}
