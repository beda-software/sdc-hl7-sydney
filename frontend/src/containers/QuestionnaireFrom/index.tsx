import React from 'react';
import * as ReactRouter from 'react-router';
import { Form, Input, Button, Row, Col, Select } from 'antd';
import { Form as FinalFrom, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useFieldArray } from 'react-final-form-arrays';
import { Questionnaire, QuestionnaireItem } from 'src/contrib/aidbox';
import _ from 'lodash';
import { saveFHIRResource, getFHIRResource } from '../../contrib/aidbox-react/services/fhir';
import { useService } from '../../contrib/aidbox-react/hooks/service';
import { isSuccess } from '../../contrib/aidbox-react/libs/remoteData';

async function onSubmit(data: any) {
    const questionnaire: Questionnaire = data;
    _.each(questionnaire.item, (item) => {
        item.linkId = _.replace(item.text!, /\s+/g, '-')
    })

    const result = await saveFHIRResource(questionnaire)

    if (isSuccess(result)) {
        window.location.replace('/');
    }
}

interface InputFieldProps {
    name: string;
    label: string;
}

interface QuestionnaireFormProps {
    match: ReactRouter.match<{ id: string }>;
}

type SelectFieldProps = InputFieldProps & { options: string[] };

function InputField({name, label}: InputFieldProps) {
    return (
        <Field name={name}>
            {({ input, meta }) => {
                return (
                    <Form.Item label={label}>
                        <Input {...input}/>
                    </Form.Item>
                );
            }}
        </Field>
    )
}

function SelectField({name, label, options}: SelectFieldProps) {
    return (
        <Field name={name}>
            {({ input, meta }) => {
                return (
                    <Form.Item label={label}>
                        <Select {...input}>
                             {_.map(options, (option) => (<Select.Option value={option}>{option}</Select.Option>))}
                        </Select>
                    </Form.Item>
                );
            }}
        </Field>
    )
}

function Questions() {
    const { fields } = useFieldArray<QuestionnaireItem>('item');

    return (
      <Form.Item
        label={
          <>
            Questions{" "}
            <Button
              onClick={() =>
                fields.push({
                  linkId: "",
                  text: "",
                  required: true,
                  type: "string"
                })
              }
              icon="plus"
              shape="circle"
            />
          </>
        }
      >
        {fields.length === 0 && <span>No questions added</span>}

        {fields.map((name, index) => {
          return (
            <Row key={index} gutter={4}>
              <Col span={11}>
                <InputField name={`${name}.text`} label="Question description" />
              </Col>
              <Col span={11}>
                <SelectField name={`${name}.type`} label="Question type" options={["string", "integer"]} />
              </Col>
              <Col span={2}>
                <Button
                  onClick={() => fields.remove(index)}
                  icon="minus"
                  shape="circle"
                />
              </Col>
            </Row>
          );
        })}
      </Form.Item>
    );
}

export function QuestionnaireForm(props: QuestionnaireFormProps) {
    const questionnaireId = props.match.params.id;
    let questionnaire: Questionnaire = {resourceType: 'Questionnaire', status: 'active'};

    const [response] = useService<Questionnaire>(async () => (
        getFHIRResource({resourceType: 'Questionnaire', id: questionnaireId})
    ));

    if (isSuccess(response) && questionnaireId) {
        questionnaire = response.data;
    }
    
    return (
        <>
            <h2>{questionnaireId ? 'Edit questionnare' : 'New questionnare'}</h2>
            <FinalFrom
                onSubmit={onSubmit}
                initialValues={questionnaire}
                mutators={{...arrayMutators}}
                render={({ handleSubmit, form: { mutators: { push, pop } }, values }) => {
                    return (
                        <Form onSubmit={handleSubmit}>
                            <InputField name="title" label="Questionnaire title"/>
                            <Questions/>
                            <Button type="primary" htmlType="submit">
                                Save
                            </Button>
                        </Form>
                    );
                }}
            />
        </>
    )
}