import cookie from 'js-cookie'
import { isPlainObject, isString } from 'vtils'
import { RequestOptions } from 'vtils/lib/request'
import { BackgroundRequest } from './background'

const baseUrl = `${location.protocol}//${location.host}/api/`

const request = (options: {
  url: string,
  method: 'GET' | 'POST',
  data?: object,
  responseDataType?: RequestOptions['responseDataType'],
}) => {
  return new Promise(resolve => {
    let url = /^(http)?s?:?\/\//i.test(options.url)
      ? options.url
      : `${baseUrl}${options.url}`
    if (!url.startsWith('http')) {
      url = location.protocol + url
    }
    chrome.runtime.sendMessage(
      {
        type: 'httpRequest',
        options: {
          url: url,
          method: options.method,
          data: {
            ...options.data,
            ctoken: cookie.get('ctoken'),
            t: new Date().getTime(),
          },
          requestDataType: 'querystring',
          responseDataType: options.responseDataType || 'json',
        },
      } as BackgroundRequest,
      resolve
    )
  }).then(async (res: any) => {
    if (isPlainObject(res.data)) {
      return (res.data as any).data
    }
    if (isString(res.data) && res.data.startsWith('blob:')) {
      res.data = await fetch(res.data).then(res => res.arrayBuffer())
    }
    return res.data
  })
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

export function createCdnFiles({ id }: { id: number }) {
  return request({
    url: 'project/cdn.json',
    method: 'POST',
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
