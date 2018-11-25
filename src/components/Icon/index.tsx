import React from 'react'
import styles from './index.module.scss'

export default class Icon extends React.Component<React.ComponentProps<'span'> & {
  name: 'pack' | 'ie' | 'github' | 'good' | 'typescript' | 'weapp' | 'close',
  }> {
  public render() {
    const { name, className, ...props } = this.props
    return (
      <span
        className={`${className} ${styles.Iconfonter} ${styles[`Iconfonter-${name}`]}`}
        {...props}
      />
    )
  }
}
