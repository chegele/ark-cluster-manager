
import { ApiClient } from "./api-client";
import { HttpClient } from "@angular/common/http";
import { Cluster, ClusterBuilder } from "src/app/models/cluster";
import { SessionService } from "../session.service";

export class ClusterEndpoint extends ApiClient {

    constructor(http: HttpClient, private session: SessionService) { super(http) }

    async getCluster(id: string) {
        const request = {id};
        const response = await this.apiRequest('get', "/cluster", request);
        if (response.status == 200 && response.response) return <Cluster>response.response;
        return null;
    }

    async joinCluster(id: string) {
        const request = {id};
        const response = await this.apiRequest('put', "/cluster-membership", request);
        if (response.status == 200) {
            this.session.updateProfile("joinCluster", id);
            return true;
        }
        return false;
    }

    async leaveCluster(id: string) {
        const request = {id};
        const response = await this.apiRequest('delete', "/cluster-membership", request);
        if (response.status == 200) {
            this.session.updateProfile("leaveCluster", id);
            return true;
        }
        return false;
    }
    
    async createCluster(builder: ClusterBuilder) {
        const request = {...builder};
        const response = await this.apiRequest('post', "/cluster", request);
        if (response.status != 200) {
            if (response.status == 400) response.friendlyErrors = response.verboseErrors;
            if (response.status == 401) response.friendlyErrors.push("You must be logged in to create a cluster");
            if (response.status == 403) response.friendlyErrors.push("Failed to retrieve the user profile");
            if (response.status == 410) response.friendlyErrors.push("You have exceeded the maximum aloud clusters");
            if (response.status == 429) response.friendlyErrors.push('Too many attempts - ' + response.verboseErrors[0].replace("Rate limited:", "wait"));
            if (response.friendlyErrors.length < 1) response.friendlyErrors.push("Unexpected error encountered. Try again?");
        } else {
            const id = response.response.cluster._id;
            this.session.updateProfile("createCluster", id);
        }
        return response;
    }

    async updateCluster(cluster: Cluster) {
        const request = {cluster};
        const response = await this.apiRequest('put', "/cluster", request);
        if (response.status != 200) return response.verboseErrors;
        return null;
    }

    async deleteCluster(id: string) {
        const request = {id};
        const response = await this.apiRequest('delete', "/cluster", request);
        if (response.status == 200) {
            this.session.updateProfile("deleteCluster", id);
            return true;
        }
        return false;
    }

}