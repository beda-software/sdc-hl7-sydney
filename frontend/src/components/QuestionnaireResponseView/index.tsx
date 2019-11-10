import _ from 'lodash';
import * as React from 'react';

import { Questionnaire, QuestionnaireItem, QuestionnaireResponse } from 'src/contrib/aidbox';
import {
    FormItems,
    getDisplay,
    getEnabledQuestions,
    interpolateAnswers,
    mapResponseToForm,
} from 'src/utils/questionnaire';

interface Props {
    resource: QuestionnaireResponse;
    questionnaire: Questionnaire;
}

type FormValues = FormItems;

function hasAnswers(item: QuestionnaireItem, parentPath: string[], values: FormValues): boolean {
    if (item.type === 'group') {
        const groupParentPath = [...parentPath, item.linkId, 'items'];
        const enabledGroupQuestions = getEnabledQuestions(item.item!, groupParentPath, values);

        return _.some(enabledGroupQuestions, (groupItem) => hasAnswers(groupItem, groupParentPath, values));
    }

    const answers = _.get(values, [...parentPath, item.linkId]);

    return _.some(answers, ({ value }) => !_.isEmpty(value));
}

export class QuestionnaireResponseView extends React.Component<Props> {
    public renderAnswer(rawQuestionItem: QuestionnaireItem, parentPath: string[], values: FormValues): any {
        const questionItem = {
            ...rawQuestionItem,
            text: interpolateAnswers(rawQuestionItem.text!, parentPath, values),
        };
        const { linkId, type, item, text, unit } = questionItem;

        if (_.isEmpty(_.get(values, [...parentPath, linkId]))) {
            return null;
        }

        const fieldPath = [...parentPath, linkId];

        if (type === 'group') {
            if (item) {
                return (
                    <>
                        <div>{text}</div>
                        {this.renderQuestions(item, [...fieldPath, 'items'], values)}
                    </>
                );
            }
        } else {
            const answers = _.get(values, fieldPath);

            return (
                <>
                    <div>{text}</div>
                    {_.map(answers, ({ value }, index) => {
                        return (
                            <div key={index}>
                                <b>
                                    {type === 'attachment' &&
                                    value.Reference &&
                                    value.Reference.resourceType === 'DocumentReference' ? (
                                        /* TODO: support Attachment */
                                        <a
                                            className="text-primary cursor-pointer"
                                            onClick={() => {
                                                // TOOD: do it
                                            }}
                                        >
                                            {getDisplay(value)}
                                        </a>
                                    ) : (
                                        getDisplay(value)
                                    )}{' '}
                                    {unit && unit.display!}
                                </b>
                                {item && this.renderQuestions(item, [...fieldPath, _.toString(index), 'items'], values)}
                            </div>
                        );
                    })}
                </>
            );
        }

        return null;
    }

    public renderQuestions(items: QuestionnaireItem[], parentPath: string[], values: FormValues) {
        const enabledQuestions = getEnabledQuestions(items, parentPath, values);

        return _.map(enabledQuestions, (item, index) => (
            <div key={index}>{this.renderAnswer(item, parentPath, values)}</div>
        ));
    }

    public renderRootQuestions(items: QuestionnaireItem[], parentPath: string[], values: FormValues) {
        const enabledQuestions = getEnabledQuestions(items, parentPath, values);

        if (_.every(enabledQuestions, (item) => !hasAnswers(item, parentPath, values))) {
            return 'No answers given';
        }

        return this.renderQuestions(enabledQuestions, parentPath, values);
    }

    public render() {
        const { resource, questionnaire } = this.props;
        const values = mapResponseToForm(resource, questionnaire);

        return (
            <div className="questionnaire-response-container">
                {_.map(questionnaire.item, (group, index) => (
                    <React.Fragment key={index}>
                        <h2 className="questionnaire-response-title">{group.text!}</h2>
                        <div>{this.renderRootQuestions(group.item!, [group.linkId, 'items'], values)}</div>
                    </React.Fragment>
                ))}
            </div>
        );
    }
}
