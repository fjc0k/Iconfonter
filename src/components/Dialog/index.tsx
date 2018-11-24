import React from 'react'
import Icon from '../Icon'
import styles from './index.module.scss'

export default class Dialog extends React.Component<{
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
      <div className={`${styles.dialog} ${this.props.visible ? '' : styles.hidden}`}>
        <div className={styles.mask} onClick={this.toggle} />
        <div className={styles.content}>
          <div className={styles.title}>
            {this.props.title}
          </div>
          <div className={styles.main}>
            {this.props.children}
          </div>
          <div className={styles.footer}>
            {this.props.footer}
          </div>
          <Icon
            className={styles.close}
            name='close'
            onClick={this.toggle}
          />
        </div>
      </div>
    )
  }
}
