import lavenstein from "js-levenshtein"
import type { Fields } from "../../../types"

type AutoMatchAccumulator<T> = {
  distance: number
  value: T
}

export const findMatch = <T extends string>(
  header: string,
  fields: Fields<T>,
  autoMapDistance: number,
): T | undefined => {
  const calculateDistanceLowerCasedStrings = (k1: string, k2: string) => lavenstein(k1.toLowerCase(), k2.toLowerCase())

  const smallestValue = fields.reduce<AutoMatchAccumulator<T>>((acc, field) => {
    const distance = Math.min(
      ...[
        calculateDistanceLowerCasedStrings(field.key, header),
        ...(field.alternateMatches?.map((alternate) => calculateDistanceLowerCasedStrings(alternate, header)) || []),
      ],
    )
    return distance < acc.distance || acc.distance === undefined
      ? ({ value: field.key, distance } as AutoMatchAccumulator<T>)
      : acc
  }, {} as AutoMatchAccumulator<T>)
  return smallestValue.distance <= autoMapDistance ? smallestValue.value : undefined
}
