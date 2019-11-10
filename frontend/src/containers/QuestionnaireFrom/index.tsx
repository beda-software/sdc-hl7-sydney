import React from 'react';
import { Form, Input, Button, Row, Col, Select } from 'antd';
import { Form as FinalFrom, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { useFieldArray } from 'react-final-form-arrays';
// import { RemoteData } from 'src/contrib/aidbox-react/libs/remoteData';
import { Questionnaire, QuestionnaireItem } from 'src/contrib/aidbox';
import _ from 'lodash';
import { saveFHIRResource } from '../../contrib/aidbox-react/services/fhir';

async function onSubmit(data: any) {
    const questionnaire: Questionnaire = data;
    _.each(questionnaire.item, (item) => {
        item.linkId = _.replace(item.text!, /\s+/g, '-')
    })

    return await saveFHIRResource(questionnaire)
}

interface InputFieldProps {
    name: string;
    label: string;
}

interface QuestionnaireFormProps {
    questionnaire?: Questionnaire;
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
    return (
        <FinalFrom
            onSubmit={onSubmit}
            initialValues={{...props.questionnaire, resourceType: 'Questionnaire', status: 'active'}}
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
    )
}