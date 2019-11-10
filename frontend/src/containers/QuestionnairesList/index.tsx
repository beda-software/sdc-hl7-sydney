import React, { useState } from 'react';
import { Col, Row, Button } from 'antd';

interface Props {
    id: string;
}

export function QuestionnairesList(props: Props) {
    const [showFrom, setShowFrom] = useState<boolean>(false);

    return (
        <Row>
            <Col span={24}>
                <Button type='default' onClick={() => setShowFrom(true)}>CreateQuestionnaire</Button>
            </Col>
            {showFrom && (
                <Col>
                    
                </Col>
            )}
        </Row>
    );
}