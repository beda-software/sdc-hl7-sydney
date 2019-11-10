import React from 'react';
import * as _ from 'lodash';
import { Col, Row, Button, List, Spin } from 'antd';
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
            <Row>
                <Col span={24}>
                    <Link to='/questionnaire/new'>
                        <Button type='default'>CreateQuestionnaire</Button>
                    </Link>
                </Col>
                
                <h2>Add new response</h2>
                <List>
                    {questionnaires && questionnaires.length ? (
                        _.map(questionnaires, (questionnaire) => (
                            <List.Item key={questionnaire.id}>
                                <Link to={`/questionnaire/edit/${questionnaire.id}` }>
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
            </Row>
        );
    }
    return <Spin />
}