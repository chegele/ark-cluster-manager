
const component : string = "cluster-announcements";
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { PageMessageComponent } from 'src/app/components/page-message/page-message.component';
import { Cluster } from 'src/app/models/cluster';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';
import { v4 as uuid } from 'uuid';

interface Announcement {
  id: string,
  date: Date,
  content: string;
  editor?: string;
  expanded?: boolean;
  overflowing?: boolean; 
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterAnnouncementsViewComponent implements OnInit {

  @Input() cluster: Cluster;
  @Input() notify: PageMessageComponent
  protected isOwner = false;
  protected announcements: Announcement[] = [];
  protected verifyDeletion: Announcement | null = null;
  protected editingAnnouncement: Announcement | null = null;
  protected paging = {
    currentPage: 1,
    lastPage: 0,
    concurrent: 1,
    startIndex: 0,
    endIndex: 1,
    finalIndex: 0,
  }

  constructor(
    private api: ApiService,
    private session: SessionService
  ) {}

  ngOnInit() {
    const profile = this.session.getProfile();
    if (profile && profile.username == this.cluster.owner) this.isOwner = true;
    const sort = (a: any, b: any) => <number><unknown>new Date(b.date) - <number><unknown>new Date(a.date);
    this.announcements = this.cluster.homepage.announcements.sort(sort);
    this.updatePagingValues();
  }

  protected updatePagingValues() {
    this.paging.lastPage = Math.ceil(this.announcements.length / this.paging.concurrent);
    this.paging.finalIndex = this.announcements.length - 1;
    if (this.paging.currentPage > this.paging.lastPage) this.changePage("first");
    this.changePage("current");
  }

  protected changePage(action: ('first' | 'previous' | 'next' | 'last' | 'current')) {
    if (action == "first") this.paging.currentPage = 1;
    if (action == "last") this.paging.currentPage = this.paging.lastPage;
    if (action == "previous" && this.paging.currentPage > 1) this.paging.currentPage--;
    if (action == "next" && this.paging.currentPage < this.paging.lastPage) this.paging.currentPage++;
    this.paging.startIndex = this.paging.currentPage * this.paging.concurrent - this.paging.concurrent;
    const endIndex = this.paging.startIndex + this.paging.concurrent;
    this.paging.endIndex = endIndex >= this.paging.finalIndex ? this.paging.finalIndex + 1 : endIndex;
    setTimeout(this.checkForOverflow.bind(this), 250);
  }

  protected async checkForOverflow() {
    for (const ann of this.announcements.slice(this.paging.startIndex, this.paging.endIndex)) {
      const element = document.getElementById(ann.id);
      if (!element) continue;
      ann.overflowing = element.offsetHeight < element.scrollHeight; 
    }
  }

  protected getDate(date: Date | string) {
    return new Date(date).toLocaleDateString();
  }

  protected resetAnnouncement(ann: Announcement) {
    const element = document.getElementById(ann.id);
    if (!element) return;
    element.scrollTop = 0; 
  }

  protected async startEditing(announcement: Announcement | null) {
    if (!announcement) announcement = { id: uuid(), date: new Date(), content: "" };
    if (announcement.content == "") announcement.editor = "## Title \n Announcement details here.";
    else announcement.editor = announcement.content;
    this.editingAnnouncement = announcement;
  }

  protected async stopEditing(content: string) {
    const announcement = <Announcement> this.editingAnnouncement;
    const index = this.announcements.findIndex(item => item.id == announcement.id);
    announcement.editor = content;
    if (index == -1) await this.createAnnouncement(announcement);
    else await this.updateAnnouncement(announcement);
    this.editingAnnouncement = null;
  }

  protected validateInput(content: string): string | null {
    const chars = content.length;
    const min = 50;
    const max = 1200;
    if (content.includes("## Title " || content.includes("Announcement details here"))) {
      return "You must replace the default announcement text.";
    }
    else if (content.length < min) return `Announcements should be more descriptive. Add at least ${min - chars} more characters.`;
    else if (content.length > max) return `Announcements are intended for concise communications. Characters: ${chars}/${max}`;
    else return null;
  }

  private async createAnnouncement(announcement: Announcement) {
    if (!announcement.editor) return;
    if (this.announcements.length >= 12) {
      this.notify.error("You can only have 12 active announcements.");
      return;
    }
    announcement.content = announcement.editor;
    this.announcements.unshift(announcement);
    const errors = await this.api.cluster.updateCluster(this.cluster);
    if (errors && errors.length > 0) {
      const index = this.announcements.indexOf(announcement);
      if (index != -1) this.announcements.splice(index, 1);
      errors.unshift("Failed to save the announcement.");
      this.notify.error(errors);
      return;
    }
    this.notify.success("Successfully saved the announcement.");
    this.updatePagingValues();
  }

  private async updateAnnouncement(announcement: Announcement) {
    if (!announcement.editor) return;
    const backup = announcement.content;
    announcement.content = announcement.editor;
    const errors = await this.api.cluster.updateCluster(this.cluster);
    if (errors && errors.length > 0) {
      errors.unshift("Failed to save the updated announcement.");
      announcement.content = backup;
      this.notify.error(errors);
      return;
    }
    this.notify.success("Successfully updated the announcement.");
    this.updatePagingValues();
  }

  protected async deleteAnnouncement(announcement: Announcement) {
    const index = this.announcements.findIndex(item => item.id == announcement.id);
    if (index == -1) return;
    this.announcements.splice(index, 1);
    const errors = await this.api.cluster.updateCluster(this.cluster);
    this.verifyDeletion = null;
    if (errors && errors.length > 0) {
      this.announcements.splice(index, 0, announcement);
      errors.unshift("Failed to delete the announcement.");
      this.notify.error(errors);
      return;
    }
    this.notify.success("Successfully deleted the announcement.");
    this.updatePagingValues();
  }

}
