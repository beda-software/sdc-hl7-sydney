import _ from 'lodash';
import * as React from 'react';
import { Button, Form, Tabs } from 'antd';
import { Field, Form as FinalForm, FormRenderProps } from 'react-final-form';

import { InputField, ChooseField, DateTimePickerField } from '../../components/fields';
import { Questionnaire, QuestionnaireItem, QuestionnaireResponse, QuestionnaireResponseItem } from '../../contrib/aidbox';
import {
    FormAnswerItems,
    FormItems,
    getDisplay,
    getEnabledQuestions,
    interpolateAnswers,
    isValueEqual,
    mapFormToResponse,
    mapResponseToForm,
} from '../../utils/questionnaire';
import { makeValidator } from '../../services/validation';

interface Props {
    resource: QuestionnaireResponse;
    questionnaire: Questionnaire;
    onSave: (resource: QuestionnaireResponse) => Promise<any> | void;
    customWidgets?: {
        [linkId: string]: (
            questionItem: QuestionnaireItem,
            fieldPath: string[],
            formParams: FormRenderProps
        ) => React.ReactNode;
    };
    readOnly?: boolean;
}

interface State {
    activeTab: number;
}

type FormValues = FormItems;

export class QuestionnaireResponseForm extends React.Component<Props, State> {
    public state = { activeTab: 0 };

    public isGroupValid = (questionnaireGroup: QuestionnaireItem, questionnaireResponse: QuestionnaireResponse) => {
        function getGroupItemSchema(group: QuestionnaireResponseItem): any {
            const items = _.filter(
                group.item!,
                (item: QuestionnaireItem) => (item.required || item.type === 'group') && _.isEmpty(item.enableWhen)
            );

            return {
                type: 'array',
                ...(items.length
                    ? {
                        allOf: _.map(items, (item: QuestionnaireItem) => ({
                            contains: {
                                properties: {
                                    linkId: { type: 'string', const: item.linkId },
                                    ...(item.type === 'group'
                                        ? { item: getGroupItemSchema(item) }
                                        : { answer: { type: 'array', minItems: 1 } }),
                                },
                                required: ['linkId', ...(item.type === 'group' ? ['item'] : ['answer'])],
                                errorMessage: {
                                    required: 'Required',
                                },
                            },
                        })),
                    }
                    : {}),
                default: [],
            };
        }

        const validationSchema = {
            properties: {
                item: getGroupItemSchema(questionnaireGroup),
            },
            required: ['item'],
            errorMessage: {
                required: 'Required',
            },
        };
        const questionnaireResponseGroup = _.find(
            questionnaireResponse.item,
            (item) => item.linkId === questionnaireGroup.linkId
        ) || { linkId: questionnaireGroup.linkId };

        const errors = makeValidator(validationSchema)(questionnaireResponseGroup);

        return _.isEmpty(errors);
    };

    public onSave = async (values: FormValues) => {
        const { onSave } = this.props;
        const updatedResource = this.fromFormValues(values);

        return onSave(updatedResource);
    };

    public fromFormValues(values: FormValues) {
        const { questionnaire, resource } = this.props;

        return {
            ...resource,
            ...mapFormToResponse(values, questionnaire),
        };
    }

    public toFormValues(): FormValues {
        const { resource, questionnaire } = this.props;

        return mapResponseToForm(resource, questionnaire);
    }

    public renderRepeatsAnswer(
        renderAnswer: (
            questionItem: QuestionnaireItem,
            parentPath: string[],
            formParams: FormRenderProps,
            index: number
        ) => React.ReactNode,
        questionItem: QuestionnaireItem,
        parentPath: string[],
        formParams: FormRenderProps
    ) {
        const { linkId, text, helpText, required, repeats } = questionItem;
        const baseFieldPath = [...parentPath, linkId];

        if (!repeats) {
            return renderAnswer(questionItem, parentPath, formParams, 0);
        }

        if (!required) {
            console.error('TODO: Unsupported question which is not required and repeats');
        }

        return (
            <Field name={baseFieldPath.join('.')}>
                {({ input }) => {
                    return (
                        <div>
                            <div>{text}</div>

                            {_.map(input.value.length ? input.value : [{}], (elem, index: number) => {
                                if (index > 0 && !input.value[index]) {
                                    return null;
                                }

                                return (
                                    <div key={index} className="d-flex">
                                        <div className="flex-grow-1">
                                            {renderAnswer(
                                                _.omit(questionItem, ['text', 'helpText']),
                                                parentPath,
                                                formParams,
                                                index
                                            )}
                                        </div>
                                        {index > 0 ? (
                                            <div
                                                style={{ width: 40, height: 40 }}
                                                className="d-flex align-items-center justify-content-center"
                                                onClick={() =>
                                                    input.onChange(
                                                        _.filter(
                                                            input.value,
                                                            (val, valIndex: number) => valIndex !== index
                                                        )
                                                    )
                                                }
                                            >
                                                Delete{' '}
                                            </div>
                                        ) : (
                                                <div style={{ width: 40 }} />
                                            )}
                                    </div>
                                );
                            })}
                            <Button
                                onClick={() => input.onChange(input.value.length ? [...input.value, {}] : [{}, {}])}
                            >
                                Add another answer
                            </Button>
                            {helpText && <div>{helpText}</div>}
                        </div>
                    );
                }}
            </Field>
        );
    }

    public renderAnswerNumeric(
        questionItem: QuestionnaireItem,
        parentPath: string[],
        formParams: FormRenderProps,
        index = 0
    ) {
        const { linkId, text, type, item, unit, helpText, required } = questionItem;
        const fieldPath = [...parentPath, linkId, _.toString(index)];

        const inputFieldPath = [...fieldPath, 'value', type];

        return (
            <>
                <InputField
                    name={inputFieldPath.join('.')}
                    fieldProps={{
                        parse: (value: any) =>
                            value ? (type === 'integer' ? _.parseInt(value) : parseFloat(value)) : undefined,
                        validate: required
                            ? (inputValue: any) => (_.isUndefined(inputValue) ? 'Required' : undefined)
                            : undefined,
                    }}
                    type="number"
                    label={text}
                    helpText={helpText}
                    addonAfter={unit && unit.display!}
                />
                {item ? this.renderQuestions(item, [...fieldPath, 'items'], formParams) : null}
            </>
        );
    }

    public renderAnswerText(
        questionItem: QuestionnaireItem,
        parentPath: string[],
        formParams: FormRenderProps,
        index = 0
    ) {
        const { linkId, text, item, helpText, required } = questionItem;
        const fieldPath = [...parentPath, linkId, _.toString(index)];

        return (
            <>
                <InputField
                    name={[...fieldPath, 'value', 'string'].join('.')}
                    fieldProps={{
                        validate: required
                            ? (inputValue: any) => (_.isUndefined(inputValue) ? 'Required' : undefined)
                            : undefined,
                    }}
                    type={questionItem.type === 'string' ? 'text' : 'textarea'}
                    label={text}
                    helpText={helpText}
                />
                {item ? this.renderQuestions(item, [...fieldPath, 'items'], formParams) : null}
            </>
        );
    }

    public renderAnswerDateTime(
        questionItem: QuestionnaireItem,
        parentPath: string[],
        formParams: FormRenderProps,
        index = 0
    ) {
        const { linkId, text, item, helpText, required } = questionItem;
        const fieldPath = [...parentPath, linkId, _.toString(index)];

        return (
            <>
                <DateTimePickerField
                    name={[...fieldPath, 'value', questionItem.type].join('.')}
                    showTime={questionItem.type === 'dateTime'}
                    fieldProps={{
                        validate: required
                            ? (inputValue: any) => (_.isUndefined(inputValue) ? 'Required' : undefined)
                            : undefined,
                    }}
                    label={text}
                    helpText={helpText}
                />
                {item ? this.renderQuestions(item, [...fieldPath, 'items'], formParams) : null}
            </>
        );
    }

    public renderAnswerChoice(questionItem: QuestionnaireItem, parentPath: string[], formParams: FormRenderProps) {
        const { linkId, text, answerOption, item, repeats, required } = questionItem;
        const fieldPath = [...parentPath, linkId, ...(repeats ? [] : ['0'])];
        const fieldName = fieldPath.join('.');

        return (
            <ChooseField<FormAnswerItems>
                name={fieldName}
                label={text}
                multiple={repeats}
                inline={!item && !repeats}
                options={_.map(answerOption, (opt) => ({
                    value: { value: opt.value },
                    label: getDisplay(opt.value),
                }))}
                fieldProps={{
                    validate: required
                        ? (inputValue: any) => {
                            if (repeats) {
                                if (!inputValue.length) {
                                    return 'Choose at least one option';
                                }
                            } else {
                                if (!inputValue) {
                                    return 'Required';
                                }
                            }

                            return undefined;
                        }
                        : undefined,
                }}
                isEqual={(value1: any, value2: any) => isValueEqual(value1.value, value2.value)}
                renderOptionContent={(option, index, value) => {
                    const selectedIndex = _.findIndex(_.isArray(value) ? value : [value], (answer) =>
                        isValueEqual(answer.value, option.value.value)
                    );

                    if (item && selectedIndex !== -1) {
                        const subItemParentPath = [
                            ...fieldPath,
                            ...(repeats ? [_.toString(selectedIndex)] : []),
                            'items',
                        ];

                        return this.renderQuestions(item, subItemParentPath, formParams);
                    }

                    return null;
                }}
            />
        );
    }

    public renderCustomWidget = (
        questionItem: QuestionnaireItem,
        parentPath: string[],
        formParams: FormRenderProps,
        index = 0
    ) => {
        const { customWidgets } = this.props;
        const { linkId, item } = questionItem;
        const fieldPath = [...parentPath, linkId, _.toString(index)];
        const customWidget = _.get(customWidgets, linkId);

        if (!customWidget) {
            return null;
        }

        return (
            <>
                {customWidget(questionItem, fieldPath, formParams)}
                {item ? this.renderQuestions(item, [...fieldPath, 'items'], formParams) : null}
            </>
        );
    };

    public renderAnswer(rawQuestionItem: QuestionnaireItem, parentPath: string[], formParams: FormRenderProps): any {
        const { customWidgets } = this.props;
        const questionItem = {
            ...rawQuestionItem,
            text: interpolateAnswers(rawQuestionItem.text!, parentPath, formParams.values),
            helpText: rawQuestionItem.helpText! ? rawQuestionItem.helpText! : undefined,
        };
        const { linkId, type, item, text } = questionItem;

        if (_.has(customWidgets, linkId)) {
            return this.renderRepeatsAnswer(this.renderCustomWidget, questionItem, parentPath, formParams);
        }

        if (type === 'integer' || type === 'decimal') {
            return this.renderRepeatsAnswer(this.renderAnswerNumeric, questionItem, parentPath, formParams);
        }
        if (type === 'string' || type === 'text') {
            return this.renderRepeatsAnswer(this.renderAnswerText, questionItem, parentPath, formParams);
        }
        if (type === 'date' || type === 'dateTime') {
            return this.renderRepeatsAnswer(this.renderAnswerDateTime, questionItem, parentPath, formParams);
        }
        if (type === 'choice') {
            return this.renderAnswerChoice(questionItem, parentPath, formParams);
        }
        if (type === 'display') {
            return <div>{questionItem.text}</div>;
        }
        if (type === 'group') {
            if (item) {
                return (
                    <>
                        <div>{text}</div>
                        {this.renderQuestions(item, [...parentPath, linkId, 'items'], formParams)}
                    </>
                );
            }
        }

        console.error(`TODO: Unsupported item type ${type}`);

        return null;
    }

    public renderQuestions(items: QuestionnaireItem[], parentPath: string[], formParams: FormRenderProps) {
        return _.map(getEnabledQuestions(items, parentPath, formParams.values), (item, index) => (
            <div key={index}>{this.renderAnswer(item, parentPath, formParams)}</div>
        ));
    }

    public renderForm = (items: QuestionnaireItem[], formParams: FormRenderProps) => {
        const { readOnly } = this.props;
        const { handleSubmit, submitting } = formParams;
        const { activeTab } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 2 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        // TODO: enable validation
        // const tabValidationState = _.map(questionnaire.item, (group) => this.isGroupValid(group, this.fromFormValues(values)));

        return (
            <Tabs
                activeKey={_.toString(activeTab)}
                onChange={(newActiveTab) => this.setState({ activeTab: _.parseInt(newActiveTab) })}
            >
                {_.map(items, (group, index) => (
                    <Tabs.TabPane tab={group.text} key={_.toString(index)}>
                        <Form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSubmit();
                            }}
                            {...formItemLayout}
                        >
                            {this.renderQuestions(group.item!, [group.linkId, 'items'], formParams)}
                            {!readOnly && (
                                <div className="questionnaire-form-actions">
                                    <Button htmlType="submit" disabled={submitting} loading={submitting}>
                                        {activeTab === items.length - 1 ? 'Save' : 'Next'}
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </Tabs.TabPane>
                ))}
            </Tabs>
        );
    };

    public render() {
        const { questionnaire } = this.props;

        return (
            <FinalForm<FormValues>
                onSubmit={this.onSave}
                initialValues={this.toFormValues()}
                initialValuesEqual={_.isEqual}
            >
                {(params) => {
                    const items = getEnabledQuestions(questionnaire.item!, [], params.values);

                    return this.renderForm(items, { ...params, values: params.values });
                }}
            </FinalForm>
        );
    }
}
