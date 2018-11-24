import React from 'react'
import ReactDom from 'react-dom'
import qs from 'qs'
import base64 from 'base64-js'
import { request } from 'vtils'
import { Button } from '../../components'
import styles from './Project.module.scss'

const getProjectDetail = (): Promise<{
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
  },
}> => {
  return request({
    url: '//iconfont.cn/api/project/detail.json',
    data: {
      pid: qs.parse(location.search).projectId,
    },
    requestDataType: 'querystring',
  }).then(({ data }) => (data as any).data)
}

const Box = class extends React.Component {
  private genTypes = () => {
    getProjectDetail().then(data => {
      const type = data.icons.reduce((res, icon) => {
        res.push(`'${icon.font_class}'`)
        return res
      }, []).join(' | ')
      console.log(type)
    })
  }

  private genWeappCss = () => {
    getProjectDetail().then(({ project, font, icons }) => {
      request({
        url: font.ttf_file,
        responseDataType: 'arraybuffer',
      }).then(({ data }) => {
        const base64String = base64.fromByteArray(new Uint8Array(data))
        const base64UrlString = `data:font/truetype;charset=utf-8;base64,${base64String}`
        const css = `
          @font-face {
            font-family: "${project.font_family}";
            src: url("${base64UrlString}") format("truetype");
          }

          .${project.font_family} {
            font-family: "${project.font_family}" !important;
            font-size: 1em;
            font-style: normal;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          ${(
            icons
              .map(icon => `.${project.prefix}-${icon.font_class}:before {\n  content: "\\${Number(icon.unicode).toString(16)}";\n}`)
              .join('\n\n')
          )}
        `.replace(/ {10}| {14}/g, '').trim()
        console.log(css)
      })
    })
  }

  public render() {
    return (
      <div className={styles.box}>
        <div className={styles.body}>
          <Button onClick={this.genTypes}>
            生成 Typescript 类型
          </Button>
          <Button onClick={this.genWeappCss}>
            生成小程序 CSS
          </Button>
        </div>
        <div className={styles.footer}>
          打赏一个包子~
        </div>
      </div>
    )
  }
}

window.addEventListener('load', () => {
  new MutationObserver(() => {
    const el = document.querySelector(`.${styles.popup}`) as HTMLDivElement
    if (document.querySelector('.project-iconlist')) {
      if (!el) {
        const _el = document.createElement('div')
        _el.className = styles.popup
        document.body.appendChild(_el)
        ReactDom.render(<Box />, _el)
      } else {
        el.style.display = 'block'
      }
    } else {
      if (el) {
        el.style.display = 'none'
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true,
  })
})
