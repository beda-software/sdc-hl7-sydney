import React from 'react'
import * as _ from 'lodash';
import { useService } from '../../contrib/aidbox-react/hooks/service'
import { getFHIRResources, extractBundleResources } from '../../contrib/aidbox-react/services/fhir'
import { Questionnaire } from 'src/contrib/aidbox'
import { NewQuestionnaireResponseControl } from '../NewQuestionnaireResponseControl';

import { Spin, List } from 'antd';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';



interface Props { }

export function QuestionnaireResponseList(props: Props) {
    const { } = props

    const [bundleResponse] = useService(() => getFHIRResources<Questionnaire>('Questionnaire', {}), [])
    if (isSuccess(bundleResponse)) {
        const resourcesByType = extractBundleResources(bundleResponse.data);
        const questionnaires = resourcesByType.Questionnaire
        console.log(questionnaires)

        return (
            <>
                <h2>Add new response</h2>
                <List>
                    {questionnaires && questionnaires.length ? (
                        _.map(questionnaires, (questionnaire) => <List.Item key={questionnaire.id}><NewQuestionnaireResponseControl questionnaire={questionnaire} /></List.Item>)
                    ) : <p>No questionnaires added</p>}
                </ List>
            </>
        )
    }
    return <Spin />;
}
