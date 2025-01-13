/**
 * Logger hook
 * Provides the component with a function that logs the given message with the name of the component before the message.
 * So they construct it with the name of the component, and then they can call it with just the message.
 */
function useLogger(componentName: string) {

    const log = (message: string, ...args: any[]) => {
        console.log(componentName + ":\n\t", message, ...args);
    };

    const warn = (message: string, ...args: any[]) => {
        console.log(componentName + ":\n\t", message, ...args);
    };

    const error = (message: string, ...args: any[]) => {
        console.log(componentName + ":\n\t", message, ...args);
    };

    // `log` is the default export. `warn` and `error` are optional.
    // const functions = { log, warn, error };
    // return Object.assign(log, functions);   // `log` as the default export. others are destructured options
    // Return an array where the first element is log
    const loggerArray = [log, warn, error];
    return Object.assign(log, { [Symbol.iterator]: () => loggerArray[Symbol.iterator]() });
}

export default useLogger;