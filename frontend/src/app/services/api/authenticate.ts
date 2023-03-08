
import { ApiClient } from "./api-client";
import { HttpClient } from "@angular/common/http";
import { SessionService } from "../session.service";
import { Profile } from "src/app/models/database/profile";

export class AuthenticateEndpoint extends ApiClient {

    constructor(http: HttpClient, private session: SessionService) { super(http) }

    async isLoggedIn() {
        const response = await this.apiRequest('get', '/authenticate', null);
        if (response.status == 403) {
            const profile = <Profile | null>response?.response?.user;
            if (profile) this.session.setProfile(profile);
            return true;
        } else {
            this.session.clearProfile();
        }
        return false;
    }

    async login(username: string, password: string, key?: string) {
        const request = {username, password, key}
        const response = await this.apiRequest('get', '/authenticate', request);
        if (response.status == 200 && response.response !=null) {
            const profile = <Profile>response.response.user;
            if (profile) this.session.setProfile(profile);
            return "";
        } else {
            switch(response.status) {
                case 400: return 'Missing the username and/or password';
                case 401: return response.verboseErrors[0];
                case 403: return 'You are already logged in';
                case 429: return 'Too many login attempts - ' + response.verboseErrors[0].replace("Rate limited:", "wait");
                default: return 'Unexpected error prevented login - Try again?';
            }
        }
    }

    async logout() {
        const response = await this.apiRequest('delete', '/authenticate', {});
        this.session.clearProfile();
        if (response.status == 200) return true;
        return false;
    }

    async register(username: string, password: string, email: string) {
        const request = {username, password, email};
        const response = await this.apiRequest('post', '/authenticate', request);
        if (response.status == 200 && response.response !=null) {
            const profile = <Profile>response.response.user;
            if (profile) this.session.setProfile(profile);
            return "";
        } else {
            switch(response.status) {
                case 400: return 'Missing the username, password, and/or email';
                case 403: return 'You are already logged in';
                case 409: return 'The username or email address is already in use';
                case 422: return response.verboseErrors.join(', ');
                case 429: return 'Too many registration attempts - ' + response.verboseErrors[0].replace("Rate limited:", "wait");
                default: return 'Unexpected error prevented signup - Try again?';
            }
        }
    }

    async sendResetKey(username: string, email:string) {
        const request = {username, email};
        const response = await this.apiRequest('post', '/reset-password', request);
        if (response.status == 200 || response.status == 401) {
            return null;
        } else {
            return response.verboseErrors;
        }
    }

    // Used when a uses does not know their password
    async resetPassword(username: string, email: string, key: string, password: string) {
        const request = {username, email, key, password};
        const response = await this.apiRequest('post', '/reset-password', request);
        if (response.status != 200) {
            return response.verboseErrors;
        } else {
            return null;
        }
    }

    // Used when user knows their current password
    async updatePassword() {

    }

}