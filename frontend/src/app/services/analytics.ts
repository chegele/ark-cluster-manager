
import { Injectable } from "@angular/core";
import { SessionService } from "./session.service";
import { environment } from "src/environments/environment";
import Plausible from "plausible-tracker";

interface Data {
    [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

    private disableAnalytics = environment.environment == "development";
    private username = "n/a";
    private prodDomain = "ark-cluster-manager.com"; 
    private testDomain = "testing.ark-cluster-manager.com"; 
    private domain = environment.environment == "production" ? this.prodDomain : this.testDomain;
    private plausible = Plausible({domain: this.domain});

    constructor(private session: SessionService) {
        console.log(environment);
        if (this.disableAnalytics) return;
        this.plausible.enableAutoOutboundTracking();
    }

    private getUser() {
        if (this.username != "n/a") return this.username;
        const profile = this.session.getProfile();
        if (profile) this.username = profile.username;
        return this.username;
    }

    private trackEvent(name: string, data: Data = {}) {
        if (this.disableAnalytics) return;
        data['username'] = this.getUser();
        const eventOptions = {props: data};
        this.plausible.trackEvent(name, eventOptions);
    }

    public pageVisit(url?: string) {
        console.log("visit");
        if (this.disableAnalytics) return;
        console.log("tracking")
        const viewOptions = url ? {url} : undefined;
        const eventOptions = {props: {username: this.getUser()}};
        this.plausible.trackPageview(viewOptions, eventOptions);
    }

    public login() { 
        this.trackEvent("login") 
    
    }
    public logout() { 
        this.trackEvent("logout"); 
        this.username = "n/a"; 
    }

    public announcementCreated(platform: string) { this.trackEvent("announcement-created", {platform}) }
    public announcementUpdated(platform: string) { this.trackEvent("announcement-updated", {platform}) }
    public announcementDeleted(platform: string) { this.trackEvent("announcement-deleted", {platform}) }
    public clusterCreated(platform: string) { this.trackEvent("cluster-created", {platform}) }
    public clusterUpdated(platform: string) { this.trackEvent("cluster-updated", {platform}) }
    public clusterDeleted(platform: string) { this.trackEvent("cluster-deleted", {platform}) }
    public clusterHomepageUpdate(platform: string) { this.trackEvent("cluster-homepage-updated", {platform}) }
    public clusterJoined(clusterName: string) { this.trackEvent("cluster-joined", {clusterName}) }
    public clusterLeft(clusterName: string) { this.trackEvent("cluster-left", {clusterName}) }
    public configCreated() { this.trackEvent("config-created") }
    public configDeleted() { this.trackEvent("config-deleted") }

}