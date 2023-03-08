
const component : string = "footer-nav-view";
import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

interface NavItem {
  icon: string;
  text: string;
  route?: string;
  action?: Function;
  elementId?: string;
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class FooterNavViewComponent {

  displayNavItems: NavItem[] = [];

  private loggedInNavItems: NavItem[] = [
    { icon: "houseFill", text: "Home", route: "/" },
    { icon: "gearFill", text: "Configs", route: "/profile", elementId: "config-section" },
    { icon: "databaseFill", text: "Clusters", route: "/profile", elementId: "owned-section" },
    { icon: "personFill", text: "Joined", route: "/profile", elementId: "member-section" },
    { icon: "boxOut", text: "Logout", action: this.logout.bind(this) }
  ];

  private loggedOutNavItems: NavItem[] = [
    { icon: "houseFill", text: "Home", route: "/" },
    { icon: "boxIn", text: "Login", route: "/login" },
  ];

  
  constructor(
    private router: Router, 
    private session: SessionService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const profile = this.session.getProfile();
    this.displayNavItems = profile ? this.loggedInNavItems : this.loggedOutNavItems;
  }

  navClicked(item: NavItem) {
    if (item.action) item.action();
    if (item.route) this.router.navigate([item.route]);
    if (item.elementId) this.scrollTo(item.elementId);
  }

  scrollTo(section: string){
    const element = document.getElementById(section);
    element?.scrollIntoView({behavior: 'smooth'});
  }

  async logout() {
    await this.api.authenticate.logout();
    this.router.navigate(["/"]);
  }

}
