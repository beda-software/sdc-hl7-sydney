import _ from "lodash";
import { oc } from "ts-optchain";

import {
  AidboxReference,
  Observation,
  QuestionnaireItem,
  QuestionnaireItemEnableWhen,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer
} from "src/contrib/aidbox";

import { getByPath, setByPath } from "../utils/path";

// TODO: Write own type
type AnswerValue = Required<QuestionnaireResponseItemAnswer>["value"] &
  Required<Observation>["value"];

export function getDisplay(value: AnswerValue): string {
  const valueType = _.keys(value)[0];

  if (valueType === "Attachment") {
    return oc(value).Attachment.title() || oc(value).Attachment.url() || "";
  }

  if (valueType === "Reference") {
    return oc(value).Reference.display("");
  }

  if (valueType === "Coding") {
    return oc(value).Coding.display("");
  }

  if (valueType === "CodeableConcept") {
    // TODO: generalize for array of coding
    return oc(value).CodeableConcept.coding[0].display("");
  }

  if (valueType === "Quantity") {
    const code = {
      system: value.Quantity!.system!,
      code: value.Quantity!.code!
    };
    return `${oc(value).Quantity.value()} ${
      code ? code : oc(value).Quantity.code()
    }`;
  }

  return value[valueType];
}

export function getValueInteger(
  answer: QuestionnaireResponseItemAnswer
): number | undefined {
  return oc(answer).value.integer();
}

export function getValueString(
  answer: QuestionnaireResponseItemAnswer
): string | undefined {
  return oc(answer).value.string();
}

export function getValueCoding(
  answer: QuestionnaireResponseItemAnswer
): string | undefined {
  return oc(answer).value.Coding.code();
}

export function getValueReference(
  answer: QuestionnaireResponseItemAnswer
): AidboxReference<any> | undefined {
  return oc(answer).value.Reference();
}

export function isValueEqual(
  firstValue: AnswerValue,
  secondValue: AnswerValue
) {
  const firstValueType = _.keys(firstValue)[0];
  const secondValueType = _.keys(secondValue)[0];

  if (firstValueType !== secondValueType) {
    return false;
  }

  if (firstValueType === "Coding") {
    return oc(firstValue).Coding.code() === oc(secondValue).Coding.code();
  }

  return _.isEqual(firstValue, secondValue);
}

export function getPathForLinkId(
  questionnaire: { item?: QuestionnaireItem[] },
  linkId: string
) {
  function walk(tree: { item?: QuestionnaireItem[] }, path: any) {
    const foundItem = _.find(tree.item, { linkId });

    if (foundItem) {
      return [
        ...path,
        "item",
        { linkId },
        ...(foundItem.type !== "group" ? [null] : [])
      ];
    }

    let foundPath = null;
    _.each(tree.item, (item: any) => {
      if (!_.isEmpty(item.item)) {
        foundPath = walk(item, [
          ...path,
          "item",
          { linkId: item.linkId },
          ...(item.type !== "group" ? [null] : [])
        ]);

        if (foundPath) {
          return false;
        }
      }

      return;
    });

    return foundPath;
  }

  return walk(questionnaire, []);
}

export function preparePathForQuestion(path: any) {
  const newPath: any[] = [];
  let skipNextPart = false;

  _.each(path, part => {
    if (_.isNull(part)) {
      return;
    }

    if (skipNextPart) {
      skipNextPart = false;

      return;
    }

    if (part === "answer") {
      skipNextPart = true;

      return;
    }

    newPath.push(part);
  });

  return newPath;
}

export function preparePathForAnswers(path: any, parentAnswers = []) {
  let parentAnswerIndex = 0;

  return _.flatMap(path, (part, index: number) => {
    if (_.isNull(part)) {
      if (parentAnswerIndex > parentAnswers.length - 1) {
        if (index === path.length - 1) {
          return ["answer"];
        }

        throw Error(
          `Can not prepare path for answers because you did not pass all required answers:` +
            `${JSON.stringify(path)}`
        );
      }

      const parentAnswer = parentAnswers[parentAnswerIndex];
      parentAnswerIndex += 1;

      return ["answer", parentAnswer];
    }

    return part;
  });
}

export function makeResponseResource(
  questionnaireId: string,
  params?: Partial<QuestionnaireResponse>
): QuestionnaireResponse {
  return {
    resourceType: "QuestionnaireResponse",
    questionnaire: questionnaireId,
    status: "in-progress",
    item: [],
    ...params
  };
}

export interface FormGroupItems {
  items: FormItems;
}

export interface FormAnswerItems {
  value: any;
  items?: FormItems;
}

export interface FormItems {
  [linkId: string]: FormGroupItems | FormAnswerItems[];
}

interface QuestionnaireItems {
  item?: QuestionnaireItem[];
}

interface ResponseItems {
  item?: QuestionnaireResponseItem[];
}

function isGroup(question: QuestionnaireItem) {
  return question.type === "group";
}

function isFormGroupItems(
  question: QuestionnaireItem,
  answers: FormGroupItems | FormAnswerItems[]
): answers is FormGroupItems {
  return isGroup(question) && _.isPlainObject(answers);
}

function isResponseGroupItems(
  question: QuestionnaireItem,
  answers: QuestionnaireResponseItemAnswer | QuestionnaireResponseItemAnswer[]
): answers is QuestionnaireResponseItemAnswer {
  return isGroup(question) && (_.isPlainObject(answers) || !answers);
}

function hasSubAnswerItems(items?: FormItems): items is FormItems {
  return !!items && _.some(items, x => !_.some(x, _.isEmpty));
}

export function mapFormToResponse(
  answersItems: FormItems,
  questionnaire: QuestionnaireItems
): ResponseItems {
  return _.reduce(
    answersItems,
    (acc, answers, linkId) => {
      const path = getPathForLinkId(questionnaire, linkId);

      if (!path) {
        return acc;
      }

      const answerPath = preparePathForAnswers(path, []);
      const questionPath = preparePathForQuestion(path);
      const question = getByPath(questionnaire, questionPath);

      if (isFormGroupItems(question, answers)) {
        return setByPath(acc, answerPath, {
          linkId,
          ...mapFormToResponse(answers.items, question)
        });
      } else {
        return _.reduce(
          answers,
          (newAcc, answer, index) => {
            if (!answer.value) {
              return newAcc;
            }

            return setByPath(newAcc, [...answerPath, index], {
              value: answer.value,
              ...(hasSubAnswerItems(answer.items)
                ? mapFormToResponse(answer.items, question)
                : {})
            });
          },
          acc
        );
      }
    },
    {}
  );
}

export function mapResponseToForm(
  resource: ResponseItems,
  questionnaire: QuestionnaireItems
): FormItems {
  return _.reduce(
    questionnaire.item,
    (acc, { linkId }) => {
      const path = getPathForLinkId(questionnaire, linkId);
      const answerPath = preparePathForAnswers(path, []);
      const questionPath = preparePathForQuestion(path);
      const question = getByPath(questionnaire, questionPath);
      const answers:
        | QuestionnaireResponseItemAnswer
        | QuestionnaireResponseItemAnswer[] = getByPath(resource, answerPath);

      if (isResponseGroupItems(question, answers)) {
        return {
          ...acc,
          [linkId]: {
            items: mapResponseToForm(answers, question)
          }
        };
      } else {
        return {
          ...acc,
          [linkId]: _.map(answers, answer => ({
            value: answer.value,
            items: mapResponseToForm(answer, question)
          }))
        };
      }
    },
    {}
  );
}

export function findAnswersForQuestionsRecursive(
  linkId: string,
  values?: FormItems
): any | null {
  if (values && _.has(values, linkId)) {
    return values[linkId];
  }

  return _.reduce(
    values,
    (acc, v) => {
      if (acc) {
        return acc;
      }

      if (_.isArray(v)) {
        return _.reduce(
          v,
          (acc2, v2) => {
            if (acc2) {
              return acc2;
            }

            return findAnswersForQuestionsRecursive(linkId, v2.items);
          },
          null
        );
      } else {
        return findAnswersForQuestionsRecursive(linkId, v.items);
      }
    },
    null
  );
}

function findAnswersForQuestion(
  linkId: string,
  parentPath: string[],
  values: FormItems
) {
  const p = _.cloneDeep(parentPath);

  // Go up
  while (p.length) {
    const part = p.pop();

    if (part === "items") {
      if (_.has(_.get(values, [...p, part]), linkId)) {
        return _.get(values, [...p, part, linkId]);
      }
    }
  }

  // Go down
  const answers = findAnswersForQuestionsRecursive(linkId, values);

  return answers ? answers : [];
}

function getChecker(
  operator: string
): (values: Array<{ value: any }>, answerValue: any) => boolean {
  if (operator === "=") {
    return (values, answerValue) =>
      _.findIndex(values, ({ value }) => isValueEqual(value, answerValue)) !==
      -1;
  }

  if (operator === "!=") {
    return (values, answerValue) =>
      _.findIndex(values, ({ value }) => isValueEqual(value, answerValue)) ===
      -1;
  }

  if (operator === "exists") {
    return (values, answerValue) => {
      const answersLength = _.reject(values, value => _.isEmpty(value.value))
        .length;
      if (answerValue.boolean) {
        return answersLength > 0;
      }

      return answersLength === 0;
    };
  }

  console.error(`Unsupported enableWhen.operator ${operator}`);

  return _.constant(true);
}

function isQuestionEnabled(
  enableWhen: QuestionnaireItemEnableWhen[],
  enableBehavior: string | undefined,
  parentPath: string[],
  values: FormItems
) {
  const iterFn = enableBehavior === "any" ? _.some : _.every;

  return iterFn(enableWhen, ({ question, answer, operator }) => {
    const check = getChecker(operator);

    if (_.includes(parentPath, question)) {
      // TODO: handle double-nested values
      const parentAnswerPath = _.slice(parentPath, 0, parentPath.length - 1);
      const parentAnswer = _.get(values, parentAnswerPath);

      return check(parentAnswer ? [parentAnswer] : [], answer);
    }

    const answers = findAnswersForQuestion(question, parentPath, values);

    return check(_.compact(answers), answer);
  });
}

export function getEnabledQuestions(
  items: QuestionnaireItem[],
  parentPath: string[],
  values: FormItems
) {
  return _.filter(items, item => {
    const { enableWhen, enableBehavior } = item;

    if (enableWhen) {
      if (!isQuestionEnabled(enableWhen, enableBehavior, parentPath, values)) {
        return false;
      }
    }

    return true;
  });
}

export function interpolateAnswers(
  text: string,
  parentPath: string[],
  values: FormItems
) {
  const matches = text.match(/<[^>]+>/g);
  if (matches) {
    return _.reduce(
      matches,
      (result, match) => {
        const linkId = match.replace(/[<>]/g, "");

        const answers = findAnswersForQuestion(linkId, parentPath, values);

        if (answers.length) {
          return result.replace(
            match,
            _.join(_.map(answers, answer => getDisplay(answer.value)), ", ")
          );
        } else {
          return result.replace(match, "[not answered yet]");
        }
      },
      text
    );
  }

  return text;
}

export function extractAnswers(
  questionnaireResponse: QuestionnaireResponse,
  predicate: (tree: any) => boolean
) {
  const answers: Array<{ path: any[]; answer: any }> = [];

  function walk(tree: any, path: any[]) {
    if (_.isPlainObject(tree)) {
      if (predicate(tree)) {
        answers.push({
          path: [...path],
          answer: tree
        });
      }
    }

    if (_.isPlainObject(tree) || _.isArray(tree)) {
      _.each(tree, (branch, key) => walk(branch, [...path, key]));
    }
  }

  walk(questionnaireResponse, []);

  return answers;
}

export function extractQuestionByLinkId(
  questionnaire: QuestionnaireItems,
  linkId: string
): QuestionnaireItem {
  const path = getPathForLinkId(questionnaire, linkId);
  const questionPath = preparePathForQuestion(path);

  return getByPath(questionnaire, questionPath);
}

export function extractAnswersByLinkId(
  questionnaireResponse: QuestionnaireResponse,
  linkId: string
): QuestionnaireResponseItemAnswer[] {
  return _.flatMap(
    extractAnswers(questionnaireResponse, (obj: any) => obj.linkId === linkId),
    ({ answer }) => answer.answer
  );
}

export function extractAnswersDisplay(
  questionnaireResponse: QuestionnaireResponse,
  linkId: string
) {
  return extractAnswersByLinkId(questionnaireResponse, linkId).map(
    ({ value }) => getDisplay(value!)
  );
}
