
const component : string = "page-message";
import { Component } from '@angular/core';
import {trigger, state, style, animate, transition } from '@angular/animations';

type MessageType = ('info' | 'error' | 'success');

interface Message {
  style: MessageType
  content: string;
  duration: number;
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
  animations: [
    trigger('expand', [
        state('expand', style({ height: "fit-content", padding: "15px 15px" })),
        state('contract', style({ height: "0px", padding: "0px 15px" })),
        transition('* => *', animate("0.55s"))
    ]),
    trigger("fade", [
        state('in', style({ opacity: "0" })),
        state('out', style({ opacity: "1" })),
        transition('* => *', animate("0.25s"))
    ])
  ]
})
export class PageMessageComponent {

  private INITIAL_DURATION = 2000;
  private INCREMENT_SCALE = 100;
  protected messageQueue: Message[] = [];
  protected processingMessages = false;
  protected fadeMessage = false;
  protected currentMessage = "";
  protected currentStyle = "none";
  protected showClose = false;

  public info(message: string | string[]) { this.addMessages(message, 'info') } 
  public error(message: string | string[]) { this.addMessages(message, 'error') }
  public success(message: string | string[]) { this.addMessages(message, 'success') }

  protected async clearMessages() {
    this.processingMessages = false;
    await this.wait(500);
    this.messageQueue = [];
    this.currentMessage = "";
    this.currentStyle = "none"
  }

  private addMessages(messages: string | string[], type: MessageType) {
    if (typeof messages == 'string') messages = [messages];
    for (const message of messages) {
      const duration = message.length * this.INCREMENT_SCALE + this.INITIAL_DURATION;
      this.messageQueue.push({content: message, style: type, duration});
    }
    if (!this.processingMessages) this.processMessages();
  }

  private async processMessages() {
    this.processingMessages = true;
    while(this.messageQueue.length > 0) {
      const next = <Message> this.messageQueue.shift();
      if (this.fadeMessage) {
        this.fadeMessage = false;
        await this.wait(250);
      }
      this.currentMessage = next.content;
      this.currentStyle = next.style;
      this.fadeMessage = true;
      await this.wait(next.duration);
    }
    this.fadeMessage = false;
    this.processingMessages = false;
    await this.wait(500);
    this.currentMessage = "";
    this.currentStyle = "none"
  }

  private wait(milliseconds: number) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

}
