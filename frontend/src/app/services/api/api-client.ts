
import { lastValueFrom} from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import { ApiResponse } from 'src/app/models/api-response';
import { environment } from 'src/environments/environment';

type Method = 'get' | 'post' | 'put' | 'delete';

export class ApiClient {
    
    private apiURL: string = environment.apiURL;

    constructor(private http: HttpClient) { }

    private responseError(status: number, responseObject: object): ApiResponse {
        const response = this.responseSuccess(responseObject);
        response.status = status
        return response;
    }

    private responseSuccess(responseObject: object): ApiResponse {
        let verboseErrors = [];
        let response = <any>{};
        for (const [key, value] of Object.entries(responseObject)) {
            if (key == 'errors') verboseErrors = value;
            else response[key] = value;
        }
        return {
            status: 200,
            verboseErrors, 
            friendlyErrors: [],
            response
        }
    }

    async apiRequest(method: Method, endpoint: string, data: string | object | FormData | null) {
        try {
            endpoint = this.apiURL + endpoint;
            let headers = new HttpHeaders({ 'Content-Type':  'application/json', method});
            if (data == null) data = {};
            if (data instanceof FormData) {
                headers = headers.delete("Content-Type");
            } else if (typeof(data) == 'object') {
                data = JSON.stringify(data, undefined, 2);
            } 
            const request = this.http.put(endpoint, data, {headers, withCredentials: true});
            const response = <object>await lastValueFrom(request);
            return this.responseSuccess(response);
        } catch(err) {
            if (err instanceof HttpErrorResponse) {
                return this.responseError(err.status, err.error);
            } else { 
                return this.responseError(500, {errors: ["Invalid response"]});
            }
        } 
    }

}