
const component : string = "clusters-view";
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Profile } from 'src/app/models/database/profile';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClustersViewComponent {

  @Input() type: ('ownership' | 'membership');
  protected profile: Profile;
  protected clusterIds: string[] = [];
  protected maxOwnedCluster = 3;
  protected usersOwnedClusters = 0;

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
      this.clusterIds = this.type == 'ownership' ? profile.ownedClusterIds : profile.membershipClusterIds;
      this.usersOwnedClusters = profile.ownedClusterIds.length;
      this.cdr.detectChanges();
    }
  }

}
