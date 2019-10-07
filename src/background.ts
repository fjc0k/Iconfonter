import { request as baseRequest } from 'vtils'
import { RequestOptions } from 'vtils/lib/request'

export type BackgroundRequest = {
  type: 'httpRequest',
  options: RequestOptions,
}

chrome.runtime.onMessage.addListener(
  (request: BackgroundRequest, _, sendResponse) => {
    if (request.type === 'httpRequest') {
      baseRequest(request.options).then(res => {
        if (res.data instanceof ArrayBuffer) {
          res.data = URL.createObjectURL(new Blob([res.data])) as any
        }
        sendResponse(res)
      })
    }
    return true
  }
)
