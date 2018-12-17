import React from 'react'
import _ from './index.module.less'
import { XIcon } from '..'

export default class XButton extends React.Component<React.ComponentProps<'div'> & {
  icon?: XIcon['props']['name'],
  // data?: Data,
  // value?: Value<XButton['props']>,
  right?: React.ReactNode,
  }> {
  render() {
    const { className, icon, right, onClick, ...props } = this.props
    return (
      <div className={`${_.wrapper} ${className}`} {...props}>
        <span className={_.button} onClick={onClick}>
          {icon && (
            <XIcon name={icon} className={_.icon} />
          )}
          {this.props.children}
        </span>
        {right && (
          <span className={_.right}>
            {right}
          </span>
        )}
      </div>
    )
  }
}
