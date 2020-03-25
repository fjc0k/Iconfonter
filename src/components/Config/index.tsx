import _ from './index.module.less'
import React from 'react'
import { Input, InputNumber, Popover, Radio, Slider } from 'antd'
import { XIcon } from '../Icon'

export type IConfigOptions = Array<{
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
} | {
  type: 'text',
  placeholder: string,
})>

export interface XConfigProps {
  config: IConfigOptions,
  value: object,
  onChange: (key: string, value: any) => any,
}

export function XConfig(props: XConfigProps) {
  const { config, value, onChange } = props
  return (
    <span>
      <Popover
        placement='right'
        content={(
          <div className={_.list}>
            {config.map(item => (
              <div key={item.name} className={_.item}>
                <div className={_.title}>{item.title}</div>
                <div className={_.content}>
                  {(() => {
                    const _value = (value as any)[item.name]
                    switch (item.type) {
                      case 'slider':
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
                              <Radio.Button key={String(index)} value={option.value}>
                                {option.label}
                              </Radio.Button>
                            ))}
                          </Radio.Group>
                        )
                      case 'text':
                        return (
                          <Input
                            defaultValue={_value}
                            placeholder={item.placeholder}
                            onChange={e => onChange(item.name, e.target.value)}
                          />
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
