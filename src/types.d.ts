
type DeepRequired<T> = {
    [K in keyof T]: Required<DeepRequired<T[K]>>
}