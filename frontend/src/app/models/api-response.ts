
export interface ApiResponse {
    status: number
    verboseErrors: string[]
    friendlyErrors: string[]
    response: {
        [prop: string]: object;
    } | any
}

