import React from 'react';
import * as _ from 'lodash';
import { Button, List, Spin } from 'antd';
import { getFHIRResources, extractBundleResources } from '../../contrib/aidbox-react/services/fhir';
import { useService } from '../../contrib/aidbox-react/hooks/service';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';
import { Questionnaire } from '../../contrib/aidbox';
import { Link } from 'react-router-dom';

export function QuestionnairesList() {
    const [bundleResponse] = useService(() => getFHIRResources<Questionnaire>('Questionnaire', {}), [])
    if (isSuccess(bundleResponse)) {
        const resourcesByType = extractBundleResources(bundleResponse.data);
        const questionnaires = resourcesByType.Questionnaire

        return (
            <>
                <div style={{ display: 'flex' }}>
                    <h2>Questionnaires</h2>
                    <Link to='/questionnaire/new'>
                        <Button type='default'>CreateQuestionnaire</Button>
                    </Link>
                </div>

                <hr />
                <List>
                    {questionnaires && questionnaires.length ? (
                        _.map(questionnaires, (questionnaire) => (
                            <List.Item key={questionnaire.id}>
                                <Link to={`/questionnaire/edit/${questionnaire.id}`}>
                                    {questionnaire.title}{'  '}
                                </Link>
                                <Link to={`/questionnaire/fill/${questionnaire.id}`}>
                                    <Button type='primary'>Add response</Button>
                                </Link>
                                {' '}
                                <Link to={`/questionnaire-response/${questionnaire.id}`}>
                                    <Button type='primary'>View responses</Button>
                                </Link>
                            </List.Item>
                        ))
                    ) : <p>No questionnaires added</p>}
                </ List>
            </>
        );
    }
    return <Spin />
}