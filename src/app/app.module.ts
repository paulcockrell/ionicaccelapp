import { NgModule } from "@angular/core";
import { IonicApp, IonicModule } from "ionic-angular";
import { MyApp } from "./app.component";
import {
  CognitoUtil,
  UserLoginService,
  UserParametersService,
  UserRegistrationService
} from "../providers/cognito.service";
import { AwsUtil } from "../providers/aws.service";
import { Sensors } from "../providers/sensors.service";
import {
  LoginComponent,
  LogoutComponent,
  RegisterComponent,
  ConfirmRegistrationComponent,
  ResendCodeComponent,
  ForgotPasswordStep1Component,
  ForgotPasswordStep2Component
} from "../pages/auth/auth";
import { HomePage } from "../pages/home/home";
import { Storage } from "@ionic/storage";
import { DeviceMotionPage } from '../pages/device-motion/device-motion';
import { EventsService } from "../providers/events.service";

@NgModule({
  declarations: [
    MyApp,
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    ConfirmRegistrationComponent,
    ResendCodeComponent,
    ForgotPasswordStep1Component,
    ForgotPasswordStep2Component,
    DeviceMotionPage,
    HomePage
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    ConfirmRegistrationComponent,
    ResendCodeComponent,
    ForgotPasswordStep1Component,
    ForgotPasswordStep2Component,
    DeviceMotionPage,
    HomePage
  ],
  providers: [CognitoUtil,
    AwsUtil,
    UserLoginService,
    UserParametersService,
    UserRegistrationService,
    Storage,
    EventsService,
    Sensors]
})

export class AppModule {
}
