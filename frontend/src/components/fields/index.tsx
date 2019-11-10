import {
    Checkbox as ACheckbox,
    Radio as ARadio,
    Form,
    Input as AInput,
    Icon,
    DatePicker,
    Select,
    InputNumber,
} from 'antd';
import { FormItemProps } from 'antd/lib/form';
import * as _ from 'lodash';
import * as React from 'react';
import { Field } from 'react-final-form';
import {
    formatFHIRDate,
    formatFHIRDateTime,
    humanDate,
    humanDateTime,
    parseFHIRDate,
    parseFHIRDateTime,
} from 'src/utils/date';
import { DatePickerProps } from 'antd/lib/date-picker/interface';
// @ts-ignore;
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/dist/style.css';


export function getFormItemProps(meta: any): Pick<FormItemProps, 'validateStatus' | 'help'> {
    const hasOwnError = meta.touched && !meta.valid && _.isString(meta.error);
    const hasSubmitError = meta.touched && !meta.valid && !meta.dirtySinceLastSubmit && _.isString(meta.submitError);
    const help = (_.isString(meta.error) && meta.error) || (_.isString(meta.submitError) && meta.submitError);
    const validateStatus = hasOwnError || hasSubmitError ? 'error' : 'validating';

    return { help, validateStatus };
}

interface FieldProps {
    fieldProps?: any;
    formItemProps?: any;
    name: string;
    label?: string | React.ReactNode;
    [x: string]: any;
}

interface InputFieldProps {
    helpText?: string;
    placeholder?: string;
    append?: string;
}

export function InputField({
    name,
    fieldProps,
    formItemProps,
    label,
    helpText,
    type,
    ...props
}: FieldProps & InputFieldProps) {
    return (
        <Field name={name} {...fieldProps} type={type}>
            {({ input, meta }) => {
                const Component = type === 'textarea' ? AInput.TextArea : AInput;

                return (
                    <Form.Item {...formItemProps} label={label} {...getFormItemProps(meta)} extra={helpText}>
                        <Component {...input} {...props} />
                    </Form.Item>
                );
            }}
        </Field>
    );
}


interface ChooseFieldOption<T> {
    value: T;
    label: string;
    icon?: { type?: string; component?: React.FC };
}

interface ChooseFieldProps<T> {
    helpText?: string;
    multiple?: boolean;
    options: Array<ChooseFieldOption<T>>;
    isEqual?: (first: T, second: T) => boolean;
    renderOptionContent?: (option: ChooseFieldOption<T>, index: number, value: T | T[]) => React.ReactNode;
    radioButton?: boolean;
    onChange?: (v: any) => void;
}

export function ChooseField<T = any>({
    fieldProps,
    formItemProps,
    label,
    helpText,
    name,
    multiple,
    options,
    renderOptionContent,
    isEqual: comparator,
    radioButton,
    onChange,
}: FieldProps & ChooseFieldProps<T>) {
    const isEqual = comparator ? comparator : _.isEqual;

    return (
        <Field name={name} {...fieldProps}>
            {({ input, meta }) => {
                if (multiple) {
                    return (
                        <Form.Item {...formItemProps} label={label} {...getFormItemProps(meta)} extra={helpText}>
                            {_.map(options, (option, index) => {
                                const isSelected = _.findIndex(input.value, (x: T) => isEqual(x, option.value)) !== -1;

                                return (
                                    <React.Fragment key={`${option.value}-${index}`}>
                                        <ACheckbox
                                            checked={isSelected}
                                            onChange={(event: any) => {
                                                let value;
                                                if (event.target.checked) {
                                                    value = [...input.value, option.value];
                                                } else {
                                                    value = _.reject(input.value, (x) => isEqual(x, option.value));
                                                }
                                                input.onChange(value);
                                                if (onChange) {
                                                    onChange(value);
                                                }
                                            }}
                                        >
                                            {option.label}
                                        </ACheckbox>
                                        {renderOptionContent && renderOptionContent(option, index, input.value)}
                                    </React.Fragment>
                                );
                            })}
                        </Form.Item>
                    );
                } else {
                    const RadioElement = radioButton ? ARadio.Button : ARadio;
                    return (
                        <Form.Item {...formItemProps} label={label} {...getFormItemProps(meta)}>
                            {_.map(options, (option, index) => {
                                const isSelected = isEqual(input.value, option.value);
                                return (
                                    <React.Fragment key={`${option.value}-${index}`}>
                                        <RadioElement
                                            checked={isSelected}
                                            onChange={(event) => {
                                                const value = event.target.checked ? option.value : undefined;
                                                input.onChange(value);
                                                if (onChange) {
                                                    onChange(value);
                                                }
                                            }}
                                        >
                                            {option.icon && (
                                                <Icon {...option.icon} className="radio-element-button-icon" />
                                            )}
                                            {option.label}
                                        </RadioElement>
                                        {renderOptionContent && renderOptionContent(option, index, input.value)}
                                    </React.Fragment>
                                );
                            })}
                        </Form.Item>
                    );
                }
            }}
        </Field>
    );
}

export interface SimpleSelectFieldOption {
    label: string;
    value: string;
}

export function SimpleSelectField({
    fieldProps,
    formItemProps,
    name,
    label,
    helpText,
    options,
    ...props
}: FieldProps & { options: SimpleSelectFieldOption[] }) {
    return (
        <Field name={name} type="checkbox" {...fieldProps}>
            {({ input, meta }) => {
                return (
                    <Form.Item {...formItemProps} extra={helpText} label={label} {...getFormItemProps(meta)}>
                        <Select {...input}>
                            {_.map(options, ({ label, value }, index) => (
                                <Select.Option key={index} value={value}>
                                    {label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                );
            }}
        </Field>
    );
}

export function CheckBoxField({ fieldProps, formItemProps, name, label, helpText, ...props }: FieldProps) {
    return (
        <Field name={name} type="checkbox" {...fieldProps}>
            {({ input, meta }) => {
                return (
                    <Form.Item {...formItemProps} extra={helpText} {...getFormItemProps(meta)}>
                        <ACheckbox {...input} {...props}>
                            {label}
                        </ACheckbox>
                    </Form.Item>
                );
            }}
        </Field>
    );
}

interface DateTimePickerFieldProps extends DatePickerProps { }

export function DateTimePickerField({
    fieldProps,
    formItemProps,
    name,
    label,
    helpText,
    showTime,
    ...props
}: DateTimePickerFieldProps & FieldProps) {
    return (
        <Field name={name} {...fieldProps}>
            {({ input, meta }) => {
                return (
                    <Form.Item {...formItemProps} label={label} extra={helpText} {...getFormItemProps(meta)}>
                        <DatePicker
                            showTime={showTime}
                            {...input}
                            {...props}
                            format={showTime ? humanDateTime : humanDate}
                            value={
                                input.value
                                    ? showTime
                                        ? parseFHIRDateTime(input.value)
                                        : parseFHIRDate(input.value)
                                    : undefined
                            }
                            onChange={(date) =>
                                date
                                    ? input.onChange(showTime ? formatFHIRDateTime(date) : formatFHIRDate(date))
                                    : input.onChange(null)
                            }
                        />
                    </Form.Item>
                );
            }}
        </Field>
    );
}

interface PhoneInputFieldProps {
    onlyCountries?: string[];
}

export function PhoneInputField({
    fieldProps,
    formItemProps,
    name,
    label,
    helpText,
    onlyCountries,
}: PhoneInputFieldProps & FieldProps) {
    return (
        <Field name={name} {...fieldProps}>
            {({ input, meta }) => {
                return (
                    <Form.Item {...formItemProps} label={label} extra={helpText} {...getFormItemProps(meta)}>
                        <ReactPhoneInput
                            defaultCountry="us"
                            {...input}
                            onlyCountries={onlyCountries}
                            style={{ width: '10px' }}
                        />
                    </Form.Item>
                );
            }}
        </Field>
    );
}

export function MoneyField({ name, fieldProps, label, formItemProps, ...props }: FieldProps) {
    return (
        <Field name={name} {...fieldProps}>
            {({ input, meta }) => {
                return (
                    <Form.Item label={label} {...formItemProps} {...getFormItemProps(meta)}>
                        <InputNumber
                            {...input}
                            {...props}
                            style={{ width: '150px' }}
                            formatter={(input) => `$ ${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(input) => input!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                );
            }}
        </Field>
    );
}
