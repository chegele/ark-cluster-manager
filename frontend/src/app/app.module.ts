
// External Module
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgClickOutsideDirective } from 'ng-click-outside2';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Route Components
import { LandingRouteComponent } from './routes/landing-page/landing-page.component';
import { LoginRouteComponent } from './routes/login/login.component';
import { InvalidRouteComponent } from './routes/invalid-route/invalid-route.component';
import { ProfileRouteComponent } from './routes/profile/profile.component';
import { ClusterComponent } from './routes/cluster/cluster.component';
import { TestingRouteComponent } from './routes/testing/testing.component';

// View Component
import { HeaderNavViewComponent } from './views/header-navigation/header-nav-view.component';
import { FooterNavViewComponent } from './views/footer-navigation/footer-nav-view.component';
import { SideNavigationViewComponent } from './views/side-navigation/side-navigation.component';
import { DropdownNaViewComponent } from './views/dropdown-navigation/dropdown-nav-view.component';
import { configurationsViewComponent } from './views/configurations/configurations-view.component';
import { ClustersViewComponent } from './views/clusters/clusters-view.component';
import { ClusterHomePageViewComponent } from './views/cluster-home/home-page/cluster-home-page.component';
import { ClusterHomeDetailsComponent } from './views/cluster-home/cluster-home-details/cluster-home-details.component';
import { ClusterAnnouncementsViewComponent } from './views/cluster-home/cluster-announcements/cluster-announcements.component';
import { ClusterStatsViewComponent } from './views/cluster-home/cluster-stats/cluster-stats.component';
import { ClusterGeneralViewComponent } from './views/cluster-general/cluster-general.component';
import { ClusterLootTables } from './views/cluster-loot-tables/cluster-loot-tables.component';

// Custom Components
import { BootstrapIconComponent } from './components/bootstrap-icon/bootstrap-icon.component';
import { LoadingAnimationComponent } from './components/loading-animation/loading-animation.component';
import { InputTextFieldComponent } from './components/input-text-field/input-text-field.component';
import { InputFileFieldComponent } from './components/input-file-field/input-file-field.component';
import { InputBooleanFieldComponent } from './components/input-boolean-field/input-boolean-field.component';
import { InputEnumFieldComponent } from './components/input-enum-field/input-enum-field.component';
import { InputDateFieldComponent } from './components/input-date-field/input-date-field.component';
import { ClusterSummaryComponent } from './components/cluster-summary/cluster-summary.component';
import { ClusterBuilderComponent } from './components/cluster-builder/cluster-builder.component';
import { ClusterEditorComponent } from './components/cluster-editor/cluster-editor.component';
import { ConfigSummaryComponent } from './components/config-summary/config-summary.component';
import { ConfigUploaderComponent } from './components/config-uploader/config-uploader.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { MarkdownEditorComponent } from './components/markdown-editor/markdown-editor.component';
import { MarkdownViewerComponent } from './components/markdown-viewer/markdown-viewer.component';
import { PageMessageComponent } from './components/page-message/page-message.component';
import { ConfigSettingComponent } from './components/config-setting/config-setting.component';
import { ConfigLootTableComponent } from './components/config-loot-table/config-loot-table.component';
import { ConfigLootSummaryComponent } from './components/config-loot-summary/config-loot-summary.component';

// Custom Pipes
import { SettingsFilterPipe } from './views/cluster-general/settings-filter.pipe';

// Custom Services
import { ApiService } from './services/api/api.service';
import { SessionService } from './services/session.service';
import { UGCValidationService } from './services/ugcValidation';
import { AnalyticsService } from './services/analytics';

const routes: Routes = [
  { path: 'testing', component: TestingRouteComponent },
  { path: '', component: LandingRouteComponent },
  { path: 'login', component: LoginRouteComponent, data: {action: "login"} },
  { path: 'register', component: LoginRouteComponent, data: {action: "register"} },
  { path: 'profile', component: ProfileRouteComponent},
  { path: 'profile/:id', component: ProfileRouteComponent},
  { path: 'clusters/:id', component: ClusterComponent},
  { path: '**', component: InvalidRouteComponent }
];

@NgModule({
  declarations: [ 
    AppComponent, 
    // Routes
    TestingRouteComponent,
    LoginRouteComponent, 
    InvalidRouteComponent, 
    ProfileRouteComponent,
    ClusterComponent,
    // Views
    HeaderNavViewComponent,
    FooterNavViewComponent,
    SideNavigationViewComponent,
    DropdownNaViewComponent,
    configurationsViewComponent,
    ClustersViewComponent,
    ClusterHomePageViewComponent,
    ClusterHomeDetailsComponent,
    ClusterAnnouncementsViewComponent,
    ClusterStatsViewComponent,
    ClusterGeneralViewComponent,
    ClusterLootTables,
    // Modular Components
    BootstrapIconComponent,
    InputTextFieldComponent,
    InputFileFieldComponent,
    InputBooleanFieldComponent,
    InputEnumFieldComponent,
    InputDateFieldComponent,
    ClusterSummaryComponent,
    ConfigUploaderComponent,
    LoadingAnimationComponent,
    ConfigSummaryComponent,
    ClusterBuilderComponent,
    ResetPasswordComponent,
    MarkdownEditorComponent,
    MarkdownViewerComponent,
    ClusterEditorComponent,
    PageMessageComponent,
    ConfigSettingComponent,
    ConfigLootTableComponent,
    ConfigLootSummaryComponent,
    // Custom Pipes
    SettingsFilterPipe
  ],
  imports: [ 
    BrowserModule, 
    RouterModule.forRoot(routes), 
    FormsModule, 
    HttpClientModule,
    NgClickOutsideDirective,
    CodemirrorModule,
    BrowserAnimationsModule
  ],
  exports: [ RouterModule ],
  providers: [ 
    ApiService, 
    SessionService, 
    UGCValidationService,
    AnalyticsService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
