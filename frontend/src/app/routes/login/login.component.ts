
const component : string = "login";
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class LoginRouteComponent implements OnInit {

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private api: ApiService,
    private session: SessionService) { }

  public usernameValue: string;
  public usernameState = 0;
  public passwordValue: string;
  public passwordState = 0;
  public emailValue: string;
  public emailState = 0;
  public keyValue: string;
  public keyState = 0;
  public stage: ('login' | 'signup' | 'verify');
  public errors: string[] = [];
  public showPasswordReset = false;
  protected redirect = "/profile";

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const redirect = params['redirect'];
      if (redirect) this.redirect = redirect;
    });
    this.stage = this.router.url == "/register" ? 'signup' : 'login';
    const loggedIn = await this.api.authenticate.isLoggedIn();
    if (loggedIn) {
      const user = this.session.getProfile()?.username;
      this.router.navigate([this.redirect], { replaceUrl: true });
    }
  }

  resetErrors() {
    this.usernameState = 0;
    this.passwordState = 0;
    this.emailState = 0;
    this.keyState = 0;
    this.errors = [];
  }

  onShowLogin() {
    this.resetErrors();
    this.passwordValue = "";
    this.emailValue = "";
    this.keyValue = "";
    this.stage = "login";
  }

  onForgotPassword() {
    this.showPasswordReset = true;
  }

  onSubmit() {
    if (this.stage == 'login') this.onLogin();
    if (this.stage == 'signup') this.onRegister();
    if (this.stage == 'verify') this.onLogin();
  }

  async onLogin() {
    this.resetErrors();

    // Validate the user provided a username and password
    if (!this.usernameValue || this.usernameValue == "") {
      this.usernameState = -1;
      this.errors.push("You must provide a username.");
      return false;
    }
    if (!this.passwordValue || this.passwordValue == "") {
      this.passwordState = -1;
      this.errors.push("You must provide a password.");
      return false;
    }

    // Attempt to login
    const loginError = await this.api.authenticate.login(this.usernameValue, this.passwordValue, this.keyValue);
    const currentUser = this.session.getProfile()?.username;

    // Results which route user to an updated view
    if (loginError == "") return this.router.navigate([this.redirect]);
    if (loginError.includes("You are already logged in")) return this.router.navigate([this.redirect]);
    if (loginError.includes("account with this username does not exist")) return this.stage = 'signup'

    // Errors which display an error message
    if (loginError.includes("username and password do not match")) this.passwordState = -1;
    if (loginError.includes("must provide the key") || loginError.includes("Incorrect email verification key")) {
      this.stage = 'verify';
      this.keyState = -1;
    }
    this.errors = [loginError];
    this.passwordValue = "";
    return false;
  }

  async onRegister() {
    this.resetErrors();

    //TODO: Registration is disabled
    this.errors.push("Beta Registration is currently disabled.");
    return false;

    // Validate the user provided a username, password, and email address
    if (!this.usernameValue || this.usernameValue == "") {
      this.usernameState = -1;
      this.errors.push("You must provide a username.");
      return false;
    }
    if (!this.passwordValue || this.passwordValue == "") {
      this.passwordState = -1;
      this.errors.push("You must provide a password.");
      return false;
    }
    if (!this.emailValue || this.emailValue == "") {
      this.emailState = -1;
      this.errors.push("You must provide an email address.");
      return false;
    }

    // Attempt to register
    const registerError = await this.api.authenticate.register(this.usernameValue, this.passwordValue, this.emailValue);
    const currentUser = this.session.getProfile()?.username;

    // Results which route user to an updated view
    if (registerError.includes("You are already logged in")) return this.router.navigate([this.redirect]);
    if (registerError == "") {
      this.stage = 'verify';
      return this.onLogin();
    }

    // Results which display an error message
    if (registerError.includes("username")) this.usernameState = -1;
    if (registerError.includes("password")) this.passwordState = -1;
    if (registerError.includes("email")) this.emailState = -1;
    return this.errors = registerError.split('., ');

  }

}
