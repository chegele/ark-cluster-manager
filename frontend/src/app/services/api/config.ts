
import { ApiClient } from "./api-client";
import { HttpClient } from "@angular/common/http";
import { SessionService } from "../session.service";
import { Property } from "src/app/models/database/setting";
import { LootTable } from "src/app/models/database/loot-table";

export class ConfigEndpoint extends ApiClient {

    constructor(http: HttpClient, private session: SessionService) { super(http) }

    async upload(name: string, description: string, game: File, gameUserSettings: File) {
        const form = new FormData();
        form.append('name', name);
        form.append('description', description);
        form.append('game', game, game.name);
        form.append('gameUserSettings', gameUserSettings, gameUserSettings.name);
        const response = await this.apiRequest('post', '/config', form);
        if (response.status != 200 || response.response == null) {
            if (response.status == 400) response.friendlyErrors.push("Missing the name, description, or configuration files");
            if (response.status == 401) response.friendlyErrors.push("You must be logged in to complete this action");
            if (response.status == 403) response.friendlyErrors.push("User sync error, please log out and back in");
            if (response.status == 409) response.friendlyErrors.push("You already have a configuration with this name");
            if (response.status == 410) response.friendlyErrors.push("You have the maximum number of aloud configurations");
            if (response.status == 422) response.friendlyErrors.push("There was a problem reading a configuration file");
            if (response.status == 429) response.friendlyErrors.push('Too many attempts - ' + response.verboseErrors[0].replace("Rate limited:", "wait"));
            if (response.status == 555) response.friendlyErrors.push("Server error - unable to save configuration");
            if (response.status == 556) response.friendlyErrors.push("Server error - unable to save configuration");
            if (response.friendlyErrors.length < 1) response.friendlyErrors.push("Unexpected error encountered. Try again?");
        } else {
            const id = response.response.id;
            this.session.updateProfile("createConfig", id);

        }
        return response;
    }

    async getSummary(id: string) {
        const request = {id, category: "file"};
        const response = await this.apiRequest('get', '/config', request);
        return response;
    }

    async getGeneral(id: string) {
        const request = {id, category: "general"};
        const response = await this.apiRequest('get', '/config', request);
        if (response.verboseErrors.length > 0 || !response.response.config) return null;
        return <Property[]> response.response.config.properties; 
    }

    async getLootTable(id: string) {
        const request = {id, category: "lootTables"};
        const response = await this.apiRequest('get', '/config', request);
        if (response.verboseErrors.length > 0 || !response.response.config.lootTables) return null;
        return <LootTable[]> response.response.config.lootTables; 
    }

    async delete(id: string) {
        const request = {id}
        const result = await this.apiRequest('delete', '/config', request);
        if (result.status == 200) this.session.updateProfile("deleteConfig", id);
        return result;
    }


}