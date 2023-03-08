import { EventEmitter, Injectable } from '@angular/core';
import { Profile } from '../models/database/profile';

type profileAction = ('joinCluster' | 'leaveCluster' | 'createCluster' | 'deleteCluster' | 'createConfig' | 'deleteConfig');

@Injectable({ providedIn: 'root' })
export class SessionService {

  public profileChange = new EventEmitter<Profile>();

  public setProfile(profile: Profile) {
    sessionStorage.setItem('profile', JSON.stringify(profile));
    this.profileChange.emit(profile);
  }

  public getProfile(): Profile | null {
    let profile: Profile | null = null;
    const json = sessionStorage.getItem('profile');
    try { profile = JSON.parse(<string>json) } catch(err) {}
    return profile;
  }

  public updateProfile(action: profileAction, value: string) {
    const profile = this.getProfile();
    if (!profile) return;
    let reaction: ('add' | 'remove') = "add";
    let array: string[] = [];
    switch(action) {
      case "createCluster" : {reaction = "add"; array = profile.ownedClusterIds; break;}
      case "createConfig" : {reaction = "add"; array = profile.configurations; break;}
      case "deleteCluster" : {reaction = "remove"; array = profile.ownedClusterIds; break;}
      case "deleteConfig" : {reaction = "remove"; array = profile.configurations; break;}
      case "joinCluster" : {reaction = "add"; array = profile.membershipClusterIds; break;}
      case "leaveCluster" : {reaction = "remove"; array = profile.membershipClusterIds; break;}
    }
    if (reaction == "add") array.push(value);
     else {
      const index = array.indexOf(value);
      if (index == -1) return;
      array.splice(index, 1);
    }
    this.setProfile(profile);
  } 

  public clearProfile() {
    sessionStorage.removeItem("profile");
    // TODO: Maybe route user to login here to prevent repeat code? 
    // TODO: Keep in mind as working with logout
    // TODO: Are there any scenarios where you don't want to go back to login on logout? 
  }
  
}
