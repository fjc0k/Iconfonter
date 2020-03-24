export type BackgroundRequest = {
  type: 'httpRequest',
  options: Exclude<RequestInfo, string> & {
    responseIsFile?: boolean,
  },
}

chrome.runtime.onMessage.addListener(
  (request: BackgroundRequest, _, sendResponse) => {
    if (request.type === 'httpRequest') {
      fetch(request.options.url, request.options)
        .then(res => {
          return request.options.responseIsFile
            ? res.arrayBuffer().then(data => URL.createObjectURL(new Blob([data])))
            : res.json()
        })
        .then(sendResponse)
    }
    return true
  },
)
