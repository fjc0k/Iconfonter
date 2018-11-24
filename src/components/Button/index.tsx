import React from 'react'
import Clipboard from 'clipboard'
import { noop } from 'vtils'
import styles from './index.module.scss'

export default class Button extends React.Component<{
  copyEnable?: boolean,
  copyContent?: string,
  onCopySuccess?: () => any,
  onCopyError?: () => any,
  onClick?: () => any,
  }> {
  public static defaultProps = {
    copyEnable: false,
    copyContent: '',
    onCopySuccess: noop,
    onCopyError: noop,
    onClick: noop,
  }

  private targetRef = React.createRef<HTMLDivElement>()

  private clipboard: Clipboard = null

  public componentDidMount() {
    if (this.props.copyEnable) {
      this.clipboard = new Clipboard(this.targetRef.current, {
        text: () => this.props.copyContent,
      })
      this.clipboard.on('success', this.props.onCopySuccess)
      this.clipboard.on('error', this.props.onCopyError)
    }
  }

  public componentWillUnmount() {
    this.clipboard.destroy()
  }

  public render() {
    return (
      <div className={styles.button} onClick={this.props.onClick} ref={this.targetRef}>
        {this.props.children}
      </div>
    )
  }
}
