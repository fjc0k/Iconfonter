import _ from './index.module.less'
import React from 'react'
import { XIcon, XIconProps } from '../Icon'

export interface XButtonProps extends React.ComponentProps<'div'> {
  icon?: XIconProps['name'],
  right?: React.ReactNode,
}

export function XButton(props: XButtonProps) {
  const { className, icon, right, onClick, children, ...restProps } = props
  return (
    <div className={`${_.wrapper} ${className}`} {...restProps}>
      <span className={_.button} onClick={onClick}>
        {icon && (
          <XIcon name={icon} className={_.icon} />
        )}
        {children}
      </span>
      {right && (
        <span className={_.right}>
          {right}
        </span>
      )}
    </div>
  )
}
