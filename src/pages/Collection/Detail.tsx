import _ from './Detail.module.less'

window.addEventListener('load', () => {
  new MutationObserver(() => {
    const addButtonEl = document.querySelector(`.${_.add}`)
    const isCollectionDetailPage = /collections\/detail/.test(location.pathname)
    if (!addButtonEl) {
      if (isCollectionDetailPage) {
        const buttonGroupEl = document.querySelector('.block-radius-btn-group')
        if (buttonGroupEl) {
          const addButtonNode = document.createElement('span')
          addButtonNode.className = `radius-btn ${_.button} ${_.add}`
          addButtonNode.title = '全部加入购物车'
          addButtonNode.innerHTML = `<span class="iconfont radius-btn-inner"></span>`
          addButtonNode.onclick = () => {
            document.querySelectorAll<HTMLLIElement>('.cover-item[title="添加入库"]').forEach(addToCartButton => {
              addToCartButton.click()
            })
          }
          buttonGroupEl.appendChild(addButtonNode)
        }
      }
    } else {
      if (!isCollectionDetailPage) {
        addButtonEl.parentNode.removeChild(addButtonEl)
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true,
  })
})
