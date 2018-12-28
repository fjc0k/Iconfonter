import React from 'react'
import _ from './index.module.less'

export default class XIcon extends React.Component<React.ComponentProps<'span'> & {
  name: 'sprite' | 'json' | 'config' | 'pack' | 'weapp' | 'typescript' | 'ie' | 'github' | 'good' | 'close'
  }> {
  render() {
    const { name, className, ...props } = this.props
    return (
      <span
        className={`${className} ${_.Iconfonter} ${_[`Iconfonter-${name}`]}`}
        {...props}
      />
    )
  }
}
