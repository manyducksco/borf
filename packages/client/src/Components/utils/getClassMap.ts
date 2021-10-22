import { Subscription } from "../../types";
import { isArray, isObject, isString } from "../../utils";

export function getClassMap(classData: unknown) {
  let mapped: {
    [className: string]: boolean | Subscription<boolean>;
  } = {};

  if (isString(classData)) {
    mapped[classData] = true;
  } else if (isObject(classData)) {
    mapped = {
      ...mapped,
      ...classData,
    };
  } else if (isArray<any>(classData)) {
    Array.from(classData).forEach((item) => {
      mapped = {
        ...mapped,
        ...getClassMap(item),
      };
    });
  }

  return mapped;
}
