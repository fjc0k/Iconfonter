import React from 'react'
import { Popover, Slider, InputNumber, Radio } from 'antd'
import XIcon from '../Icon'
import _ from './index.module.less'

export type ConfigOptions = Array<{
  name: string,
  title: string,
} & ({
  type: 'slider' | 'number',
  min: number,
  max: number,
  step: number,
} | {
  type: 'radio',
  options: Array<{
    label: string | number,
    value: any,
  }>,
})>

export default class XConfig extends React.Component<{
  config: ConfigOptions,
  value: object,
  onChange: (key: string, value: any) => any,
  }> {
  render() {
    const { config, value, onChange } = this.props
    return (
      <span>
        <Popover
          placement='right'
          content={(
            <div className={_.list}>
              {config.map((item, index) => (
                <div className={_.item} key={index}>
                  <div className={_.title}>{item.title}</div>
                  <div className={_.content}>
                    {(() => {
                      const _value = (value as any)[item.name]
                      switch (item.type) {
                        case 'number':
                          const Component: any = item.type === 'slider' ? Slider : InputNumber
                          return (
                            <Component
                              size='small'
                              defaultValue={_value}
                              min={item.min}
                              max={item.max}
                              step={item.step}
                              onChange={(value: any) => onChange(item.name, value)}
                            />
                          )
                        case 'radio':
                          return (
                            <Radio.Group
                              size='small'
                              defaultValue={_value}
                              onChange={e => onChange(item.name, e.target.value)}>
                              {item.options.map((option, index) => (
                                <Radio.Button value={option.value} key={String(index)}>
                                  {option.label}
                                </Radio.Button>
                              ))}
                            </Radio.Group>
                          )
                        default:
                          break
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}>
          <XIcon className={_.icon} name='config' />
        </Popover>
      </span>
    )
  }
}
