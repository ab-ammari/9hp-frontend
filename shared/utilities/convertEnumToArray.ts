// Helper
const isString = (value: string) => isNaN(Number(value)) === false;
const isNumber = (value: string) => isNaN(Number(value)) === true;

// Turn enum into array
function convertEnumToArrayNumberFunction(enumme: string): Array<number> {
    // @ts-ignore
    return (
        Object.keys(enumme)
            .filter(isNumber)
            // @ts-ignore
            .map((key): any => enumme[key])
    );
}

export default (enumme: string): Array<number> => {
    return convertEnumToArrayNumberFunction(enumme);
};
