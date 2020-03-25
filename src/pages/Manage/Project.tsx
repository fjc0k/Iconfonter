/* eslint-disable react/jsx-handler-names */
import 'antd/lib/style/components.less'
import _ from './Project.module.less'
import base64 from 'base64-js'
import FileSaver from 'file-saver'
import JSZip from 'jszip'
import qs from 'qs'
import React from 'react'
import ReactDom from 'react-dom'
import svgToMiniDataURI from 'mini-svg-data-uri'
import { config } from '../../config'
import { createCdnFiles, fetchFile, fetchProjectInfo } from '../../api'
import { dedent, PartialBy } from 'vtils'
import { Divider, Spin } from 'antd'
import { EasyStorage, EasyStorageAdapterBrowserLocalStorage } from 'vtils'
import { formatCode, makeCSSSprite, minifySVG, parseSVG } from '../../utils'
import { IConfigOptions } from '../../components/Config'
import { pascalCase } from 'change-case'
import { XButton, XConfig, XDialog, XDialogCodeProps } from '../../components'

const storage = new EasyStorage<{
  forger: ForgerState,
}>(new EasyStorageAdapterBrowserLocalStorage())

interface ForgerProps {
  projectId: number,
}

interface ForgerState {
  loading: boolean,
  codeDialog: PartialBy<XDialogCodeProps, 'onVisibleChange'>,
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
    reactComponents: {
      kind: 'ts' | 'js',
      className: string,
    },
  },
  sponsorDialogVisible: boolean,
}

class Forger extends React.Component<ForgerProps, ForgerState> {
  constructor(props: Forger['props']) {
    super(props)
    this.state = {
      loading: false,
      codeDialog: {
        visible: false,
      } as any,
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
        reactComponents: {
          kind: 'ts',
          className: '',
        },
        ...storage.getSync('forger', {} as any),
      },
      sponsorDialogVisible: false,
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
      },
    )
  }

  runGenerator = async (generator: () => any) => {
    this.setState({ loading: true })
    await generator()
    ;(document.activeElement as HTMLButtonElement).blur()
    this.setState({ loading: false })
  }

  generateTSDefinition = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      const { ts } = this.state.config
      const projectInfo = await fetchProjectInfo({ id })
      const definition = projectInfo.icons
        .map(
          icon => `'${ts.withPrefix ? `${projectInfo.project.prefix}` : ''}${icon.font_class}'`,
        )
        .join(' | ')
      this.setState({
        codeDialog: {
          visible: true,
          title: 'TS 代码',
          language: 'typescript',
          code: definition,
          wrap: true,
        },
      })
    })
  }

  generateWeappCSS = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      await createCdnFiles({ id })
      const { project, font, icons } = await fetchProjectInfo({ id })
      const file = await fetchFile({ url: font.woff_file })
      const base64String = base64.fromByteArray(new Uint8Array(file))
      const css = dedent`
        @font-face {
          font-family: "${project.font_family}";
          src: url("data:font/woff;charset=utf-8;base64,${base64String}") format("woff");
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
      this.setState({
        codeDialog: {
          visible: true,
          title: 'CSS 代码',
          language: 'css',
          code: css,
        },
      })
    })
  }

  generateSVGZip = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      const { svgZip } = this.state.config
      const { project, icons } = await fetchProjectInfo({ id })
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
      const zipArchive = await zip.generateAsync({ type: 'blob' })
      FileSaver.saveAs(zipArchive, `${project.name}(SVG).zip`)
    })
  }

  generateDataUriJson = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      const { icons } = await fetchProjectInfo({ id })
      const json = JSON.stringify(
        icons.reduce<{ [key: string]: string }>((res, icon) => {
          res[icon.font_class] = svgToMiniDataURI(minifySVG(icon.show_svg))
          return res
        }, {}),
        null,
        2,
      )
      this.setState({
        codeDialog: {
          visible: true,
          title: 'JSON 代码',
          language: 'json',
          code: json,
        },
      })
    })
  }

  generateCSSSprite = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      const { cssSprite } = this.state.config
      const { project, icons } = await fetchProjectInfo({ id })
      const { positions, dataUri } = await makeCSSSprite({
        icons: icons.reduce((res, icon) => {
          res[icon.font_class] = icon.show_svg
          return res
        }, {} as any),
        format: cssSprite.format,
        quality: cssSprite.quality,
        iconSize: cssSprite.size,
        gap: 3,
      })
      const css = dedent`
        .${project.font_family} {
          background: url("${dataUri}") no-repeat top left;
          background-size: 1em auto;
          width: 1em;
          height: 1em;
        }

        ${positions.map(({ name, y }) => dedent`
          .${project.prefix}${name} {
            background-position: 0 -${(y / cssSprite.size).toFixed(4)}em;
          }
        `).join('\n\n')}
      `
      this.setState({
        codeDialog: {
          visible: true,
          title: 'CSS 代码',
          language: 'css',
          code: css,
        },
      })
    })
  }

  generateReactComponents = () => {
    this.runGenerator(async () => {
      const { projectId: id } = this.props
      const { config: { reactComponents } } = this.state
      const { project, icons } = await fetchProjectInfo({ id })
      const wrapperName = `${pascalCase(project.prefix)}WrapperComponent`
      const wrapperPropsTypeName = `${pascalCase(project.prefix)}WrapperComponentProps`
      const iconPropsTypeName = `${pascalCase(project.prefix)}Props`
      const code = dedent`
        import React from 'react'

        ${reactComponents.kind !== 'ts' ? '' : dedent`
          interface ${wrapperPropsTypeName} extends React.ComponentProps<'span'> {
            iconName: string,
            svgViewBox: string,
            svgPaths: React.ReactNode,
          }
        `}

        const ${wrapperName} = React.forwardRef${reactComponents.kind !== 'ts' ? '' : `<HTMLSpanElement, ${wrapperPropsTypeName}>`}((props, ref) => {
          const { iconName, svgViewBox, svgPaths, className, ...restProps } = props
          return (
            <span
              role='img'
              aria-label={iconName}
              {...restProps}
              ref={ref}
              className={\`${
                reactComponents.className
                  ? reactComponents.className
                  : ''
              }${
                reactComponents.className
                  ? '${className ? ` ${className}` : \'\'}'
                  : '${className || \'\'}'
              }\`}>
              <svg
                viewBox={svgViewBox}
                width='1em'
                height='1em'
                fill='currentColor'
                data-icon={iconName}
                aria-hidden='true'>
                {svgPaths}
              </svg>
            </span>
          )
        })
        ${wrapperName}.displayName = '${wrapperName}'

        ${reactComponents.kind !== 'ts' ? '' : dedent`
          export interface ${iconPropsTypeName} extends React.ComponentProps<'span'> {}
        `}

        ${icons.map(icon => {
          const componentName = pascalCase(`${project.prefix}_${icon.font_class}`)
          const svgInfo = parseSVG(icon.show_svg)
          return dedent`
            // ${icon.font_class}
            export const ${componentName} = React.forwardRef${reactComponents.kind !== 'ts' ? '' : `<HTMLSpanElement, ${iconPropsTypeName}>`}((props, ref) => {
              return (
                <${wrapperName}
                  {...props}
                  ref={ref}
                  iconName={\`${icon.font_class}\`}
                  svgViewBox={\`${svgInfo.viewBox}\`}
                  svgPaths={(
                    <React.Fragment>
                      ${svgInfo.paths}
                    </React.Fragment>
                  )}
                />
              )
            })
            ${componentName}.displayName = '${componentName}'
          `
        }).join('\n\n')}
      `
      this.setState({
        codeDialog: {
          visible: true,
          title: '组件代码',
          language: 'tsx',
          code: formatCode({
            language: reactComponents.kind === 'ts' ? 'typescript' : 'javascript',
            code: code,
          }),
        },
      })
    })
  }

  closeDialog = () => {
    this.setState(prevState => {
      prevState.codeDialog.visible = false
      return prevState
    })
  }

  render() {
    const { config: { ts, svgZip, cssSprite, reactComponents }, codeDialog, sponsorDialogVisible } = this.state
    return (
      <div className={_.container}>
        <Spin spinning={this.state.loading}>
          <div>
            <div className={_.actions}>
              <XButton
                icon='typescript'
                className={_.action}
                right={(
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
                    ] as IConfigOptions}
                    onChange={(key, value) => this.updateConfig('ts', key as any, value)}
                  />
                )}
                onClick={this.generateTSDefinition}>
                生成图标名称的 TS 定义
              </XButton>
              <XButton
                icon='pack'
                className={_.action}
                right={(
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
                    ] as IConfigOptions}
                    onChange={(key, value) => this.updateConfig('svgZip', key as any, value)}
                  />
                )}
                onClick={this.generateSVGZip}>
                打包下载 SVG 图标
              </XButton>
              <XButton
                icon='sprite'
                className={_.action}
                right={(
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
                    ] as IConfigOptions}
                    onChange={(key, value) => this.updateConfig('cssSprite', key as any, value)}
                  />
                )}
                onClick={this.generateCSSSprite}>
                生成雪碧图 CSS
              </XButton>
              <XButton
                icon='unit'
                className={_.action}
                right={(
                  <XConfig
                    value={reactComponents}
                    config={[
                      {
                        name: 'kind',
                        title: '代码类型',
                        type: 'radio',
                        options: [
                          {
                            label: 'TypeScript',
                            value: 'ts',
                          },
                          {
                            label: 'JavaScript',
                            value: 'js',
                          },
                        ],
                      },
                      {
                        name: 'className',
                        title: '图标类名',
                        type: 'text',
                        placeholder: '如: anticon',
                      },
                    ] as IConfigOptions}
                    onChange={(key, value) => this.updateConfig('reactComponents', key as any, value)}
                  />
                )}
                onClick={this.generateReactComponents}>
                生成 React 图标组件
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
        <div className={_.links}>
          <a href={config.repository} target='_blank'>
            开源仓库
          </a>
          <Divider type='vertical' className={_.divider} />
          <a href={config.feedback} target='_blank'>
            建议反馈
          </a>
          <Divider type='vertical' className={_.divider} />
          <a onClick={() => this.setState({ sponsorDialogVisible: true })}>
            打赏作者
          </a>
          <XDialog
            title='打赏作者'
            visible={sponsorDialogVisible}
            onVisibleChange={sponsorDialogVisible => this.setState({ sponsorDialogVisible })}>
            <Divider>支付宝</Divider>
            <img style={{ width: 200 }} referrerPolicy='no-referrer' src={config.sponsor.alipay} />
            <Divider>微信</Divider>
            <img style={{ width: 200 }} referrerPolicy='no-referrer' src={config.sponsor.wechat} />
          </XDialog>
        </div>
        <XDialog.Code
          {...codeDialog}
          onVisibleChange={this.closeDialog}
        />
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
          _forgerEl,
        )
      }
      else {
        forgerEl.style.display = 'block'
      }
    }
    else {
      if (forgerEl) {
        forgerEl.style.display = 'none'
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true,
  })
})
