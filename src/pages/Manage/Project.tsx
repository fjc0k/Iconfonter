import 'prismjs/themes/prism-tomorrow.css'
import 'react-toastify/dist/ReactToastify.css'
import React from 'react'
import ReactDom from 'react-dom'
import qs from 'qs'
import base64 from 'base64-js'
import { ToastContainer, toast } from 'react-toastify'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import { Button, Dialog, Icon, Loading } from '../../components'
import { fetchProjectInfo, createCdnFiles, fetchFile } from '../../api'
import styles from './Project.module.scss'

let projectId: number = 0

const Box = class extends React.Component<{}, {
  loadingVisible: boolean,
  dialogVisible: boolean,
  dialogTitle: string,
  dialogCode: string,
  copyContent: string,
  }> {
  public state = {
    loadingVisible: false,
    dialogVisible: false,
    dialogTitle: '',
    dialogCode: '',
    copyContent: '',
  }

  private genTypes = () => {
    this.setState({
      loadingVisible: true,
    })
    fetchProjectInfo({ id: projectId }).then(({ project, icons }) => {
      const type = icons.reduce((res, icon) => {
        res.push(`'${icon.font_class}'`)
        return res
      }, []).join(' | ')
      this.setState({
        loadingVisible: false,
        dialogVisible: true,
        dialogTitle: `项目 “${project.name}” 的 TypeScript 类型`,
        dialogCode: `<pre class="language-typescript wrap">${Prism.highlight(type, Prism.languages.typescript)}</pre>`,
        copyContent: type,
      })
    })
  }

  private genWeappCss = () => {
    this.setState({
      loadingVisible: true,
    })
    createCdnFiles({ id: projectId }).then(() => {
      fetchProjectInfo({ id: projectId }).then(({ project, font, icons }) => {
        fetchFile({ url: font.ttf_file }).then(file => {
          const base64String = base64.fromByteArray(new Uint8Array(file))
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
          `.replace(/ {12}/g, '').trim()
          this.setState({
            loadingVisible: false,
            dialogVisible: true,
            dialogTitle: `项目 “${project.name}” 的小程序 CSS`,
            dialogCode: `<pre class="language-css">${Prism.highlight(css, Prism.languages.css)}</pre>`,
            copyContent: css,
          })
        })
      })
    })
  }

  private copySuccess = () => {
    toast.success('代码复制成功！', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 1500,
    })
  }

  private copyError = () => {
    toast.error('代码复制失败！', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 1500,
    })
  }

  public render() {
    return (
      <div className={styles.box}>
        <div className={styles.body}>
          <Button className={styles.button} onClick={this.genTypes}>
            <Icon name='typescript' /> 生成 Typescript 类型
          </Button>
          <Button className={styles.button} onClick={this.genWeappCss}>
            <Icon name='weapp' /> 生成小程序 CSS
          </Button>
          <Button className={styles.button} onClick={this.genWeappCss}>
            <Icon name='pack' /> 打包 SVG 图片
          </Button>
          <Button className={styles.button} onClick={this.genWeappCss}>
            <Icon name='pack' /> 打包 SVG 图片
          </Button>
          <Button className={styles.button} onClick={this.genWeappCss}>
            <Icon name='pack' /> 打包 SVG 图片
          </Button>
        </div>
        <div className={styles.footer}>
          <span className={styles.link}>
            <Icon name='github' /> 提建议
          </span>
          <span className={styles.link}>
            <Icon name='good' /> 打赏作者
          </span>
        </div>
        <Loading visible={this.state.loadingVisible} />
        <Dialog
          title={this.state.dialogTitle}
          footer={
            <Button
              copyEnable={true}
              copyContent={this.state.copyContent}
              onCopySuccess={this.copySuccess}
              onCopyError={this.copyError}>
              复制代码
            </Button>
          }
          visible={this.state.dialogVisible}
          onVisibleChange={dialogVisible => this.setState({ dialogVisible })}>
          <div dangerouslySetInnerHTML={{ __html: this.state.dialogCode }} />
        </Dialog>
        <ToastContainer />
      </div>
    )
  }
}

window.addEventListener('load', () => {
  new MutationObserver(() => {
    projectId = Number(qs.parse(location.search).projectId)
    const el = document.querySelector(`.${styles.dock}`) as HTMLDivElement
    if (document.querySelector('.project-iconlist')) {
      if (!el) {
        const _el = document.createElement('div')
        _el.className = styles.dock
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
