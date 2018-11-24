import React from 'react'
import styles from './index.module.scss'

export default class Button extends React.Component<React.ComponentProps<'div'>> {
  public render() {
    const { children, ...props } = this.props
    return (
      <div className={styles.button} {...props}>
        {children}
      </div>
    )
  }
}
