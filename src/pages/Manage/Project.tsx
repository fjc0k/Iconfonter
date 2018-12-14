import 'antd/lib/style/components.less'
import 'prismjs/themes/prism-tomorrow.css'
import qs from 'qs'
import base64 from 'base64-js'
import React from 'react'
import ReactDom from 'react-dom'
import CopyToClipboard from 'react-copy-to-clipboard'
import JSZip from 'jszip'
import FileSaver from 'file-saver'
import { Button, Dropdown, Menu, Radio, Spin, message } from 'antd'
import { storage } from 'vtils'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import { XIcon, XDialog } from '../../components'
import { fetchProjectInfo, createCdnFiles, fetchFile } from '../../api'
import _ from './Project.module.less'

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
  options: {
    ts: {
      withPrefix: boolean,
    },
    svgZip: {
      withPrefix: boolean,
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
      options: {
        ts: {
          withPrefix: false,
        },
        svgZip: {
          withPrefix: false,
        },
        ...storage.get(_.forger, {}),
      },
    }
  }

  toggleOption = <
    Options extends keyof ForgerState['options'],
    Key extends keyof ForgerState['options'][Options],
  >(options: Options, key: Key, value: ForgerState['options'][Options][Key]): void => {
    this.setState(
      prevState => {
        prevState.options[options][key] = value
        return prevState
      },
      () => {
        storage.set(_.forger, this.state.options)
      }
    )
  }

  generateTSDefinition = () => {
    const { projectId: id } = this.props
    const { ts } = this.state.options
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(projectInfo => {
        return projectInfo.icons.map(
          icon => `'${ts.withPrefix ? `${projectInfo.project.prefix}-` : ''}${icon.font_class}'`
        ).join(' | ')
      })
      .then(definition => {
        this.setState({
          dialog: {
            visible: true,
            title: 'TypeScript 定义',
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
        return `
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

          ${(
            icons
              .map(icon => `.${project.prefix}-${icon.font_class}:before {\n  content: "\\${Number(icon.unicode).toString(16)}";\n}`)
              .join('\n\n')
          )}
        `.replace(/ {9}/g, '').trim()
      })
      .then(css => {
        this.setState({
          dialog: {
            visible: true,
            title: '小程序 CSS',
            code: css,
            html: `
              <pre class="language-typescript">${
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
    const { svgZip } = this.state.options
    this.setState({ loading: true })
    fetchProjectInfo({ id })
      .then(({ project, icons }) => {
        const zip = new JSZip()
        icons.forEach(icon => {
          const fileName = `${svgZip.withPrefix ? `${project.prefix}-` : ''}${icon.font_class}.svg`
          const fileContent = `
            <?xml version="1.0" standalone="no"?>
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
            ${icon.show_svg}
          `.replace(/ {11}/g, '').trim()
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

  closeDialog = () => {
    this.setState(prevState => {
      prevState.dialog.visible = false
      return prevState
    })
  }

  render() {
    const { options: { ts, svgZip }, dialog } = this.state
    return (
      <div>
        <Spin spinning={this.state.loading}>
          <div>
            <div className={_.actions}>
              <Dropdown.Button
                className={_.action}
                trigger={['click']}
                onClick={this.generateTSDefinition}
                overlay={(
                  <Menu>
                    <Menu.Item key='1' onClick={() => this.toggleOption('ts', 'withPrefix', false)}>
                      <Radio checked={!ts.withPrefix}>
                        图标名不带前缀
                      </Radio>
                    </Menu.Item>
                    <Menu.Item key='2' onClick={() => this.toggleOption('ts', 'withPrefix', true)}>
                      <Radio checked={ts.withPrefix}>
                        图标名带前缀
                      </Radio>
                    </Menu.Item>
                  </Menu>
                )}>
                <XIcon name='typescript' className={_.icon} />
                生成图标名称的 TS 定义
              </Dropdown.Button>
              <Button className={_.action} onClick={this.generateWeappCSS}>
                <XIcon name='weapp' className={_.icon} />
                生成小程序 CSS
              </Button>
              <Dropdown.Button
                className={_.action}
                trigger={['click']}
                onClick={this.generateSVGZip}
                overlay={(
                  <Menu>
                    <Menu.Item key='1' onClick={() => this.toggleOption('svgZip', 'withPrefix', false)}>
                      <Radio checked={!svgZip.withPrefix}>
                        图标文件名不带前缀
                      </Radio>
                    </Menu.Item>
                    <Menu.Item key='2' onClick={() => this.toggleOption('svgZip', 'withPrefix', true)}>
                      <Radio checked={svgZip.withPrefix}>
                        图标文件名带前缀
                      </Radio>
                    </Menu.Item>
                  </Menu>
                )}>
                <XIcon name='pack' className={_.icon} />
                打包下载 SVG 图标
              </Dropdown.Button>
              {/* <Button className={_.action} onClick={this.generateWeappCSS}>
                <XIcon name='weapp' className={_.icon} />
                生成 React SVG 图标组件
              </Button> */}
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
