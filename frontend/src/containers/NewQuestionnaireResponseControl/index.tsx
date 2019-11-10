import React from 'react'
import { getFHIRResource, makeReference, saveFHIRResource } from '../../contrib/aidbox-react/services/fhir';
import { Questionnaire, id } from '../../contrib/aidbox';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';
import { Resolver } from '../../components/ResolverNew'
import { QuestionnaireResponseForm } from '../../components/QuestionnaireResponseForm';
import { getFHIRCurrentDateTime } from '../../utils/date';
import { notification } from 'antd';

// interface Props {

// }

export function NewQuestionnaireResponseControl(props: any) {
    const questionnaireId: id = props.match.params.id

    return (
        <>
            <p>123</p>
            <pre>{JSON.stringify(questionnaireId, undefined, 2)}</pre>
            <Resolver
                resolve={() =>
                    getFHIRResource<Questionnaire>(
                        makeReference(
                            'Questionnaire',
                            questionnaireId
                        )
                    )
                }
            >
                {({ data: questionnaire }) => {
                    return (
                        <QuestionnaireResponseForm
                            questionnaire={questionnaire}
                            resource={{ resourceType: 'QuestionnaireResponse', status: 'patient' }}
                            onSave={async (resource) => {
                                const response = await saveFHIRResource({
                                    ...resource,
                                    authored: resource.authored ? resource.authored : getFHIRCurrentDateTime(),
                                });
                                if (isSuccess(response)) {
                                    notification.success({
                                        message: 'Questionnaire response successfully saved',
                                    });
                                } else {
                                    notification.error({ message: 'Something went wrong' });
                                }
                            }}
                        />
                    );
                }}
            </Resolver>
        </>
    )
}
