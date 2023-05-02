import type {
  Data,
  Fields,
  Info,
  RowHook,
  TableHook,
  Field,
  UniqueValidation,
  RequiredValidation,
  RegexValidation,
} from "../../../types"
import type { Meta, Errors } from "../types"
import { v4 } from "uuid"
import { merge, noop } from "lodash"

let ruleMap = {
  unique: (data: (Data<any> & Partial<Meta>)[], field: Field<any>, validation: UniqueValidation) => {
    const errors: Errors = {}
    const values = data.map((entry) => entry[field.key as any])

    const taken = new Set() // Set of items used at least once
    const duplicates = new Set() // Set of items used multiple times

    values.forEach((value) => {
      if (validation.allowEmpty && !value) {
        // If allowEmpty is set, we will not validate falsy fields such as undefined or empty string.
        return
      }

      if (taken.has(value)) {
        duplicates.add(value)
      } else {
        taken.add(value)
      }
    })

    values.forEach((value, index) => {
      if (duplicates.has(value)) {
        errors[index] = {
          ...errors[index],
          [field.key]: {
            level: validation.level || "error",
            message: validation.errorMessage || "Field must be unique",
          },
        }
      }
    })

    return errors
  },
  required: (data: (Data<any> & Partial<Meta>)[], field: Field<any>, validation: RequiredValidation) => {
    const errors: Errors = {}

    data.forEach((entry, index) => {
      if (entry[field.key] === null || entry[field.key] === undefined || entry[field.key] === "") {
        errors[index] = {
          ...errors[index],
          [field.key]: {
            level: validation.level || "error",
            message: validation.errorMessage || "Field is required",
          },
        }
      }
    })

    return errors
  },
  regex: (data: (Data<any> & Partial<Meta>)[], field: Field<any>, validation: RegexValidation) => {
    const errors: Errors = {}
    const regex = new RegExp(validation.value, validation.flags)

    data.forEach((entry, index) => {
      const value = entry[field.key]?.toString() ?? ""
      if (!value.match(regex)) {
        errors[index] = {
          ...errors[index],
          [field.key]: {
            level: validation.level || "error",
            message:
              validation.errorMessage || `Field did not match the regex /${validation.value}/${validation.flags} `,
          },
        }
      }
    })

    return errors
  },
}

export const extendRules = (rules: any[]) => {
  ruleMap = merge(ruleMap, rules)
}

export const addErrorsAndRunHooks = <T extends string>(
  data: (Data<T> & Partial<Meta>)[],
  fields: Fields<T>,
  rowHook?: RowHook<T>,
  tableHook?: TableHook<T>,
): (Data<T> & Meta)[] => {
  let errors: Errors = {}

  const addHookError = (rowIndex: number, fieldKey: T, error: Info) => {
    errors[rowIndex] = {
      ...errors[rowIndex],
      [fieldKey]: error,
    }
  }

  if (tableHook) {
    data = tableHook(data, addHookError)
  }

  if (rowHook) {
    data = data.map((value, index) => rowHook(value, (...props) => addHookError(index, ...props), data))
  }

  fields.forEach((field) => {
    field.validations?.forEach((validation) => {
      const validationFn = ruleMap[validation.rule] ?? noop

      // eslint-disable-next-line
      // @ts-ignore
      errors = merge(errors, validationFn(data, field, validation))
    })
  })

  return data.map((value, index) => {
    // This is required only for table. Mutates to prevent needless rerenders
    if (!("__index" in value)) {
      value.__index = v4()
    }
    const newValue = value as Data<T> & Meta

    if (errors[index]) {
      return { ...newValue, __errors: errors[index] }
    }
    if (!errors[index] && value?.__errors) {
      return { ...newValue, __errors: null }
    }
    return newValue
  })
}
