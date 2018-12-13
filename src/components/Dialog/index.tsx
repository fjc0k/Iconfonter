import React from 'react'
import XIcon from '../Icon'
import _ from './index.module.less'

export default class XDialog extends React.Component<{
  visible: boolean,
  title: string,
  footer?: React.ReactNode,
  onVisibleChange: (visible: boolean) => any,
  }> {
  private toggle = () => {
    const { visible } = this.props
    this.props.onVisibleChange(!visible)
  }

  public render() {
    return (
      <div className={`${_.dialog} ${this.props.visible ? '' : _.hidden}`}>
        <div className={_.mask} onClick={this.toggle} />
        <div className={_.content}>
          <div className={_.title}>
            {this.props.title}
          </div>
          <div className={_.main}>
            {this.props.children}
          </div>
          <div className={_.footer}>
            {this.props.footer}
          </div>
          <XIcon
            className={_.close}
            name='close'
            onClick={this.toggle}
          />
        </div>
      </div>
    )
  }
}
