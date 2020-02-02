import React from 'react'
import { getFHIRResource, makeReference, saveFHIRResource } from '../../contrib/aidbox-react/services/fhir';
import { mapSuccess, service } from '../../contrib/aidbox-react/services/service';
import { Questionnaire, id, Parameters, QuestionnaireResponse } from '../../contrib/aidbox';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';
import { Resolver } from '../../components/ResolverNew'
import { QuestionnaireResponseForm } from '../../components/QuestionnaireResponseForm';
import { getFHIRCurrentDateTime } from '../../utils/date';
import { notification } from 'antd';

interface Data {
    questionnaire: Questionnaire,
    questionnaireResponse?: QuestionnaireResponse,

}

export function NewQuestionnaireResponseControl(props: any) {
    const questionnaireId: id = props.match.params.id
    console.log(props);


    return (
        <>
            <Resolver<Data>
                resolve={async () => {
                    const questionnaire = await getFHIRResource<Questionnaire>(
                        makeReference(
                            'Questionnaire',
                            questionnaireId
                        )
                    );
                    if(isSuccess(questionnaire)) {
                        if(questionnaire.data.launchContext) {
                            const { name, type } = questionnaire.data.launchContext;
                            const context = await getFHIRResource({resourceType: type, id: 'example'});
                            if (isSuccess(context)) {
                                const params:Parameters = {
                                    resourceType: "Parameters",
                                    parameter: [{name, resource: context.data}]

                                };
                                const populated = await service<QuestionnaireResponse>({
                                    method: 'POST',
                                    url: `/Questionnaire/${questionnaireId}/$populate`,
                                    data: params,
                                });
                                if(isSuccess(populated)) {
                                    return mapSuccess(questionnaire, (q) => ({
                                        questionnaire: q,
                                        questionnaireResponse: populated.data,
                                    }));
                                }


                            }
                        }

                    }
                    return mapSuccess(questionnaire, (q) => ({questionnaire: q}));
                } }
            >
                {({ data }) => {
                    const { questionnaire, questionnaireResponse } = data;
                    console.log(questionnaireResponse);
                    return (
                        <>
                            <h2>New {questionnaire.title}</h2>
                            <QuestionnaireResponseForm
                                questionnaire={questionnaire}
                                resource={questionnaireResponse || { resourceType: 'QuestionnaireResponse', status: 'patient', questionnaire: questionnaireId }}
                                onSave={async (resource) => {
                                    const response = await saveFHIRResource({
                                        ...resource,
                                        authored: resource.authored ? resource.authored : getFHIRCurrentDateTime(),
                                    });
                                    if (isSuccess(response)) {
                                        notification.success({
                                            message: 'Questionnaire response successfully saved',
                                        });
                                        props.history.push('/')
                                    } else {
                                        notification.error({ message: 'Something went wrong' });
                                    }
                                }}
                            />
                        </>
                    );
                }}
            </Resolver>
        </>
    )
}
