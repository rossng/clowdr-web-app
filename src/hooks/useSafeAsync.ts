import { makeCancelable } from "clowdr-db-schema/src/classes/Util";
import { DependencyList, useCallback, useEffect } from "react";

export default function useSafeAsync<T>(
    generator: () => Promise<T | undefined>,
    setState: (newState: T) => void,
    deps: DependencyList): void {
    const generatorCallback = useCallback(generator, deps);

    useEffect(() => {
        let cancel = () => { };

        async function execute() {
            try {
                const p = makeCancelable(generatorCallback());
                cancel = p.cancel;
                const newV = await p.promise;
                if (newV) {
                    setState(newV);
                }
                cancel = () => { };
            }
            catch (e) {
                if (!e.isCanceled) {
                    throw e;
                }
            }
        }

        execute();

        return cancel;
    }, [generatorCallback, setState]);
}
