import _ from './index.module.less'
import React from 'react'

export interface XIconProps extends React.ComponentProps<'span'> {
  name: 'unit' | 'sprite' | 'json' | 'config' | 'pack' | 'weapp' | 'typescript' | 'ie' | 'github' | 'good' | 'close',
}

export function XIcon(props: XIconProps) {
  const { name, className, ...restProps } = props
  return (
    <span
      className={`${className} ${_.Iconfonter} ${_[`Iconfonter-${name}`]}`}
      {...restProps}
    />
  )
}
