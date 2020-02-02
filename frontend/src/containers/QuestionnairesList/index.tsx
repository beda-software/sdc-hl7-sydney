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
                <div style={{ maxWidth: '900px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h2>Questionnaires</h2>
                        <Link to='/questionnaire/new'>
                            <Button type='primary'>CreateQuestionnaire</Button>
                        </Link>
                    </div>

                    <hr />
                    <List<Questionnaire>
                        dataSource={questionnaires}
                        renderItem={(questionnaire) => (
                            <List.Item
                                key={questionnaire.id}

                            >
                                <List.Item.Meta title={questionnaire.title} />
                                <div>
                                    <Link to={`/questionnaire/edit/${questionnaire.id}`}>
                                        <Button type='default' size='small'>Edit questionnaire</Button>
                                    </Link>
                                    {' '}
                                    <Link to={`/questionnaire/fill/${questionnaire.id}`}>
                                        <Button type='default' size='small'>Add response</Button>
                                    </Link>
                                    {/* {' '}
                                    <Link to={`/questionnaire-response/${questionnaire.id}`}>
                                        <Button type='default' size='small'>View responses</Button>
                                    </Link> */}
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            </>
        );
    }
    return <Spin />
}