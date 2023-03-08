
const component : string = "reset-password";
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ResetPasswordComponent {

  @Input() show: boolean;
  @Output() showChange = new EventEmitter<boolean>();
  protected usernameValue = "";
  protected usernameStatus = 0;
  protected emailValue = "";
  protected emailStatus = 0;
  protected keyValue = "";
  protected keyStatus = 0;
  protected passwordValue = "";
  protected passwordStatus = 0;
  protected loading = false;
  protected emailSent = false;
  protected passwordReset = false;
  protected errors: string[] = [];

  constructor(private api: ApiService) {}

  close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  resetErrors() {
    this.errors = [];
    this.usernameStatus = 0;
    this.emailStatus = 0;
    this.keyStatus = 0;
    this.passwordStatus = 0;
  }

  validateVerificationInput() {
    let valid = true;
    if (!this.usernameValue || this.usernameValue.length < 4) {
      this.errors.push("You must provide a valid username.");
      this.usernameStatus = -1
      valid = false;
    }
    if (!this.emailValue || this.emailValue.length < 4 || !this.emailValue.includes("@")) {
      this.errors.push("You must provide a valid email address.");
      this.emailStatus = -1;
      valid = false;
    }
    return valid;
  }

  validateUpdateInput() {
    let valid = true;
    if (!this.keyValue || this.keyValue.length < 4) {
      this.errors.push("You must provide the reset key.");
      this.keyStatus = -1
      valid = false;
    }
    if (!this.passwordValue || this.passwordValue.length < 4) {
      this.errors.push("You must provide a valid password.");
      this.passwordStatus = -1;
      valid = false;
    }
    return valid;
  }

  async sendVerification() {
    this.resetErrors();
    if (!this.validateVerificationInput()) return;
    this.loading = true;
    const errors = await this.api.authenticate.sendResetKey(this.usernameValue, this.emailValue);
    this.loading = false;
    if (!errors) return this.emailSent = true;
    else {
      this.errors = errors;
      for (const err of errors) {
        if (err.toLocaleLowerCase().includes('username')) this.usernameStatus = -1;
        if (err.toLocaleLowerCase().includes('email')) this.emailStatus = -1;
      }
    }
    return null;
  }

  async updatePassword() {
    this.resetErrors();
    if (!this.validateUpdateInput()) return;
    this.loading = true;
    const errors = await this.api.authenticate.resetPassword(
      this.usernameValue,
      this.emailValue,
      this.keyValue,
      this.passwordValue
    );
    this.loading = false;
    if (!errors) return this.passwordReset = true;
    else {
      this.errors = errors;
      for (const err of errors) {
        if (err.toLocaleLowerCase().includes('key')) this.keyStatus = -1;
        if (err.toLocaleLowerCase().includes('password')) this.passwordStatus = -1;
      }
    }
    return null
  }

}
