import cookie from 'js-cookie'

const baseUrl = `${location.protocol}//${location.host}/api/`

const request = async (options: {
  url: string,
  method: 'GET' | 'POST',
  data?: Record<string, any>,
  responseDataType?: 'json' | 'arraybuffer',
}) => {
  let url = /^(http)?s?:?\/\//i.test(options.url)
    ? options.url
    : `${baseUrl}${options.url}`
  if (!url.startsWith('http')) {
    url = location.protocol + url
  }
  const data = {
    ...(options.data || {}),
    ctoken: cookie.get('ctoken'),
    t: new Date().getTime(),
  }

  const res = await fetch(url + (options.method === 'GET' ? `?${new URLSearchParams(data as any).toString()}` : ''), {
    method: options.method,
    body: options.method === 'GET'
      ? undefined
      : JSON.stringify(data),
    headers: options.method === 'GET' ? {} : {
      'Content-Type': 'application/json',
    },
  })

  if (options.responseDataType === 'arraybuffer') {
    const arrayBuffer = await res.arrayBuffer()
    return arrayBuffer
  }

  const json = await res.json()
  return json.data || json
}

export function fetchProjectInfo({ id }: { id: number }): Promise<{
  project: {
    /** 项目的名称 */
    name: string,
    /** 项目的 Font Family */
    font_family: string,
    /** 项目的类名前缀 */
    prefix: string,
  },
  icons: Array<{
    /** 图标类名（不含前缀） */
    font_class: string,
    /** 图标的 SVG */
    show_svg: string,
    /** 图标的 Unicode 码（10进制表示） */
    unicode: string,
  }>,
  font: {
    /** TTF 字体文件地址 */
    ttf_file: string,
    /** WOFF 字体文件地址 */
    woff_file: string,
  },
}> {
  return request({
    url: 'project/detail.json',
    method: 'GET',
    responseDataType: 'json',
    data: {
      pid: id,
    },
  })
}

export function fetchProjectZip({ id }: { id: number }) {
  return request({
    url: 'project/download.zip',
    method: 'GET',
    responseDataType: 'arraybuffer',
    data: {
      pid: id,
    },
  })
}

export function fetchFile({ url }: { url: string }) {
  return request({
    url: url,
    method: 'GET',
    responseDataType: 'arraybuffer',
  })
}
