import 'antd/lib/style/components.less'
import 'prismjs/themes/prism-tomorrow.css'
import qs from 'qs'
import base64 from 'base64-js'
import React from 'react'
import ReactDom from 'react-dom'
import CopyToClipboard from 'react-copy-to-clipboard'
import JSZip from 'jszip'
import FileSaver from 'file-saver'
import { Button, Spin, message } from 'antd'
import { EasyStorage, EasyStorageAdapterBrowserLocalStorage } from 'vtils'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import svgToMiniDataURI from 'mini-svg-data-uri'
import { dedent } from 'vtils'
import { XDialog, XButton, XConfig } from '../../components'
import { fetchProjectInfo, createCdnFiles, fetchFile } from '../../api'
import { ConfigOptions } from '../../components/Config'
import { minifySVG, minifyPNG } from '../../utils'
import makeCSSSprite from '../../utils/makeCSSSprite'
import _ from './Project.module.less'

const storage = new EasyStorage<{
forger: ForgerState
}>(new EasyStorageAdapterBrowserLocalStorage())

interface ForgerProps {
  projectId: number,
}

interface ForgerState {
  loading: boolean,
  dialog: {
    visible: boolean,
    title: string,
    code: string,
    html: string,
  },
  config: {
    ts: {
      withPrefix: boolean,
    },
    svgZip: {
      withPrefix: boolean,
    },
    cssSprite: {
      format: 'svg' | 'png',
      size: number,
      quality: number,
    },
  },
}

class Forger extends React.Component<ForgerProps, ForgerState> {
  constructor(props: Forger['props']) {
    super(props)
    this.state = {
      loading: false,
      dialog: {
        visible: false,
        title: '',
        code: '',
        html: '',
      },
      config: {
        ts: {
          withPrefix: false,
        },
        svgZip: {
          withPrefix: false,
        },
        cssSprite: {
          format: 'png',
          size: 32,
          quality: 70,
        },
        ...storage.getSync('forger', {} as any),
      },
    }
  }

  updateConfig = <
    T extends keyof ForgerState['config'],
    K extends keyof ForgerState['config'][T],
  >(type: T, key: K, value: ForgerState['config'][T][K]): void => {
    this.setState(
      prevState => {
        prevState.config[type][key] = value
        return prevState
      },
      () => {
        storage.set('forger', this.state.config as any)
      }
    )
  }

  generateTSDefinition = () => {
    const { projectId: id } = this.props
    const { ts } = this.state.config
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(projectInfo => {
        return projectInfo.icons.map(
          icon => `'${ts.withPrefix ? `${projectInfo.project.prefix}` : ''}${icon.font_class}'`
        ).join(' | ')
      })
      .then(definition => {
        this.setState({
          dialog: {
            visible: true,
            title: 'TS 代码',
            code: definition,
            html: `
              <pre class="language-typescript wrap">${
                Prism.highlight(definition, Prism.languages.typescript)
              }</pre>
            `,
          },
        })
      })
      .finally(() => {
        (document.activeElement as HTMLButtonElement).blur()
        this.setState({ loading: false })
      })
  }

  generateWeappCSS = () => {
    const { projectId: id } = this.props
    this.setState({ loading: true })
    createCdnFiles({ id })
      .then(() => fetchProjectInfo({ id }))
      .then(projectInfo => Promise.all([
        Promise.resolve(projectInfo),
        fetchFile({ url: projectInfo.font.woff_file }),
      ]))
      .then(([{ project, icons }, file]) => {
        const base64String = base64.fromByteArray(new Uint8Array(file))
        const base64UrlString = `data:font/woff;charset=utf-8;base64,${base64String}`
        return dedent`
          @font-face {
            font-family: "${project.font_family}";
            src: url("${base64UrlString}") format("woff");
          }

          .${project.font_family} {
            font-family: "${project.font_family}" !important;
            font-size: 1em;
            font-style: normal;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          ${icons.map(icon => dedent`
            .${project.prefix}${icon.font_class}::before {
              content: "\\${Number(icon.unicode).toString(16)}";
            }
          `).join('\n\n')}
        `
      })
      .then(css => {
        this.setState({
          dialog: {
            visible: true,
            title: 'CSS 代码',
            code: css,
            html: dedent`
              <pre class="language-css">${
                Prism.highlight(css, Prism.languages.css)
              }</pre>
            `,
          },
        })
      })
      .finally(() => {
        (document.activeElement as HTMLButtonElement).blur()
        this.setState({ loading: false })
      })
  }

  generateSVGZip = () => {
    const { projectId: id } = this.props
    const { svgZip } = this.state.config
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(({ project, icons }) => {
        const zip = new JSZip()
        icons.forEach(icon => {
          const fileName = `${svgZip.withPrefix ? `${project.prefix}-` : ''}${icon.font_class}.svg`
          const fileContent = dedent`
            <?xml version="1.0" standalone="no"?>
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
            ${icon.show_svg}
          `
          zip.file(fileName, fileContent)
        })
        return Promise.all([
          Promise.resolve(project),
          zip.generateAsync({ type: 'blob' }),
        ])
      })
      .then(([project, zip]) => {
        FileSaver.saveAs(zip, `${project.name}(SVG).zip`)
      })
      .finally(() => {
        (document.activeElement as HTMLButtonElement).blur()
        this.setState({ loading: false })
      })
  }

  generateDataUriJson = () => {
    const { projectId: id } = this.props
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(({ icons }) => {
        return JSON.stringify(
          icons.reduce<{ [key: string]: string }>((res, icon) => {
            res[icon.font_class] = svgToMiniDataURI(minifySVG(icon.show_svg))
            return res
          }, {}),
          null,
          2
        )
      })
      .then(json => {
        this.setState({
          dialog: {
            visible: true,
            title: 'JSON 代码',
            code: json,
            html: dedent`
              <pre class="language-json">${
                Prism.highlight(json, Prism.languages.json)
              }</pre>
            `,
          },
        })
      })
      .finally(() => {
        (document.activeElement as HTMLButtonElement).blur()
        this.setState({ loading: false })
      })
  }

  generateCSSSprite = () => {
    const { projectId: id } = this.props
    const { cssSprite } = this.state.config
    const size = +cssSprite.size
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(({ project, icons }) => {
        return makeCSSSprite({
          icons: icons.reduce((res, icon) => {
            res[icon.font_class] = icon.show_svg
            return res
          }, {} as any),
          format: cssSprite.format,
          quality: cssSprite.quality,
          iconSize: size,
          gap: 3,
        }).then(([icons, dataUri]) => {
          const css = dedent`
            .${project.font_family} {
              background: url("${dataUri}") no-repeat top left;
              background-size: 1em auto;
              width: 1em;
              height: 1em;
            }

            ${icons.map(({ name, y }) => dedent`
              .${project.prefix}${name} {
                background-position: 0 -${(y / size).toFixed(4)}em;
              }
            `).join('\n\n')}
          `
          this.setState({
            dialog: {
              visible: true,
              title: 'CSS 代码',
              code: css,
              html: dedent`
                <pre class="language-css">${
                  Prism.highlight(css, Prism.languages.css)
                }</pre>
              `,
            },
          })
        })
      })
      .finally(() => {
        (document.activeElement as HTMLButtonElement).blur()
        this.setState({ loading: false })
      })
  }

  closeDialog = () => {
    this.setState(prevState => {
      prevState.dialog.visible = false
      return prevState
    })
  }

  render() {
    const { config: { ts, svgZip, cssSprite }, dialog } = this.state
    return (
      <div>
        <Spin spinning={this.state.loading}>
          <div>
            <div className={_.actions}>
              <XButton
                icon='typescript'
                className={_.action}
                onClick={this.generateTSDefinition}
                right={
                  <XConfig
                    value={ts}
                    config={[
                      {
                        name: 'withPrefix',
                        title: '图标名称加上前缀',
                        type: 'radio',
                        options: [
                          { label: '是', value: true },
                          { label: '否', value: false },
                        ],
                      },
                    ] as ConfigOptions}
                    onChange={(key, value) => this.updateConfig('ts', key as any, value)}
                  />
                }>
                生成图标名称的 TS 定义
              </XButton>
              <XButton
                icon='pack'
                className={_.action}
                onClick={this.generateSVGZip}
                right={
                  <XConfig
                    value={svgZip}
                    config={[
                      {
                        name: 'withPrefix',
                        title: '图标文件名称加上前缀',
                        type: 'radio',
                        options: [
                          { label: '是', value: true },
                          { label: '否', value: false },
                        ],
                      },
                    ] as ConfigOptions}
                    onChange={(key, value) => this.updateConfig('svgZip', key as any, value)}
                  />
                }>
                打包下载 SVG 图标
              </XButton>
              <XButton
                icon='sprite'
                className={_.action}
                onClick={this.generateCSSSprite}
                right={
                  <XConfig
                    value={cssSprite}
                    config={[
                      {
                        name: 'format',
                        title: '雪碧图格式',
                        type: 'radio',
                        options: [
                          { label: 'SVG(不失真)', value: 'svg' },
                          { label: 'PNG(可压缩)', value: 'png' },
                        ],
                      },
                      { name: 'size', title: '雪碧图上图标的大小(像素，仅对 PNG 格式有效)', type: 'number', min: 0, step: 16 },
                      { name: 'quality', title: '生成的雪碧图质量(仅对 PNG 格式有效)', type: 'number', min: 0, max: 100, step: 10 },
                    ] as ConfigOptions}
                    onChange={(key, value) => this.updateConfig('cssSprite', key as any, value)}
                  />
                }>
                生成雪碧图 CSS
              </XButton>
              <XButton
                icon='weapp'
                className={_.action}
                onClick={this.generateWeappCSS}>
                生成小程序 CSS
              </XButton>
              <XButton
                icon='json'
                className={_.action}
                onClick={this.generateDataUriJson}>
                生成图标名称到 Data URI 的 JSON
              </XButton>
            </div>
          </div>
        </Spin>
        <XDialog
          title={dialog.title}
          visible={dialog.visible}
          onVisibleChange={this.closeDialog}
          footer={
            <CopyToClipboard
              text={dialog.code}
              onCopy={() => message.success('代码复制成功')}>
              <Button>复制代码</Button>
            </CopyToClipboard>
          }>
          <div dangerouslySetInnerHTML={{ __html: dialog.html }} />
        </XDialog>
      </div>
    )
  }
}

window.addEventListener('load', () => {
  new MutationObserver(() => {
    const projectId = Number(qs.parse(location.search).projectId)
    const forgerEl = document.querySelector<HTMLDivElement>(`.${_.forger}`)
    const listEl = document.querySelector<HTMLDivElement>('.project-iconlist')
    if (listEl) {
      if (!forgerEl) {
        const _forgerEl = document.createElement('div')
        _forgerEl.className = _.forger
        listEl.appendChild(_forgerEl)
        ReactDom.render(
          <Forger projectId={projectId} />,
          _forgerEl
        )
      } else {
        forgerEl.style.display = 'block'
      }
    } else {
      if (forgerEl) {
        forgerEl.style.display = 'none'
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true,
  })
})
