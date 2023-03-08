import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { SessionService } from '../session.service';
import { AuthenticateEndpoint } from './authenticate';
import { ConfigEndpoint } from './config';
import { ClusterEndpoint } from './cluster';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient, private session: SessionService) { }

  public authenticate = new AuthenticateEndpoint(this.http, this.session);
  public config = new ConfigEndpoint(this.http, this.session);
  public cluster = new ClusterEndpoint(this.http, this.session);
  
}
