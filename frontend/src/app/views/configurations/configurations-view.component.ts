
const component : string = "configurations-view";
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SessionService } from 'src/app/services/session.service';
import { Profile } from 'src/app/models/database/profile';
import { Router } from '@angular/router';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class configurationsViewComponent implements OnInit {

  protected profile: Profile;
  protected maxConfigurations = 3;
  protected usersConfigCount = 0;

  constructor(
    private session: SessionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const profile = this.session.getProfile();
    this.session.profileChange.subscribe(this.profileChange.bind(this));
    this.profileChange(profile);
  }

  profileChange(profile: Profile | null) {
    if (!profile) {
      this.router.navigate(['/login'], { replaceUrl: true });
    } else {
      this.profile = profile;
      this.usersConfigCount = profile.configurations.length;
      this.cdr.detectChanges();
    }
  }
  
}
