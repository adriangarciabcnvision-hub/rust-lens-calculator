export function uniqueStrings(values: (string |undefined)[]) {

    return [...new Set(

        values.filter(

            (v): v is string => !!v

        )

    )].sort();

}

export function containsText(value: any, text: string) {

    if(value===undefined || value===null)
        return false;

    return value
        .toString()
        .toLowerCase()
        .includes(text);

}