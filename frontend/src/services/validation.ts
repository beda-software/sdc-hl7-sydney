import Ajv from "ajv";
// @ts-ignore
import ajvErrors from "ajv-errors";
// @ts-ignore
import ajvKeywords from "ajv-keywords";
import * as _ from "lodash";

import { getByPath, setByPath } from "src/utils/path";

const ajvInstance = new Ajv({
  allErrors: true,
  $data: true,
  jsonPointers: true,
  useDefaults: true,
  extendRefs: true
});
ajvKeywords(ajvInstance);
ajvErrors(ajvInstance);

interface JsonSchema {
  [x: string]: any;
  errorMessage: any;
}

interface Error {
  path: string[];
  message: string;
}

function extractMessages(parentError: any) {
  return _.reduce(
    parentError.params.errors ? parentError.params.errors : [parentError],
    (acc: Error[], error) => {
      const path: any[] = _.map(
        _.tail(error.dataPath.split("/")),
        (part: string) => (part.match(/^\d+$/) ? _.toInteger(part) : part)
      );
      const missing = error.params.missingProperty;

      return [
        ...acc,
        {
          path: [...path, ...(missing ? [missing] : [])],
          message: parentError.message
        }
      ];
    },
    []
  );
}

export function makeValidator(jsonSchema: JsonSchema) {
  const validate = ajvInstance.compile(jsonSchema);

  return (originalValues: any) => {
    // We need to make a copy, because using defaults mutates original values
    // And it leads to final-form reinitialization
    // For details, see https://github.com/epoberezkin/ajv/issues/549
    const values = _.cloneDeep(originalValues);
    if (!validate(values) && validate.errors) {
      const errorsByPath = _.sortBy(
        _.reduce(
          validate.errors,
          (acc: Error[], error: Ajv.ErrorObject) => [
            ...acc,
            ...extractMessages(error)
          ],
          []
        ),
        ({ path }) => -path.length
      );

      return _.reduce(
        errorsByPath,
        (acc, { path, message }) => {
          if (getByPath(acc, path)) {
            return acc;
          }

          return setByPath(acc, path, message);
        },
        {}
      );
    }

    return {};
  };
}
